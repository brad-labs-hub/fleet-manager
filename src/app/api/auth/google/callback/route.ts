import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/oauth-tokens";

const GOOGLE_STATE_COOKIE = "oauth_google_state";
const GOOGLE_ACCESS_COOKIE = "oauth_google_access_token";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/imports?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/imports?error=no_code", request.url)
    );
  }

  if (!state || !expectedState || state !== expectedState) {
    const invalidStateResponse = NextResponse.redirect(
      new URL("/admin/imports?error=invalid_state", request.url)
    );
    invalidStateResponse.cookies.delete(GOOGLE_STATE_COOKIE);
    return invalidStateResponse;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/admin/imports?error=config", request.url)
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.redirect(
      new URL(`/admin/imports?error=${encodeURIComponent(err)}`, request.url)
    );
  }

  const tokens = await tokenRes.json();
  const response = NextResponse.redirect(
    new URL("/admin/imports?google_connected=1", request.url)
  );
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  if (typeof tokens.access_token === "string" && tokens.access_token.length > 0) {
    const encrypted = encryptToken(tokens.access_token);
    if (encrypted) {
      response.cookies.set({
        name: GOOGLE_ACCESS_COOKIE,
        value: encrypted,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 30,
      });
    } else {
      console.error(
        "OAUTH_TOKEN_ENCRYPTION_KEY not configured — refusing to store Google access token in plaintext."
      );
    }
  }
  return response;
}
