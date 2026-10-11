import { NextRequest, NextResponse } from "next/server";

const GOOGLE_STATE_COOKIE = "oauth_google_state";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(new URL("/admin/imports?error=config", request.url));
  }

  const state = crypto.randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  // drive.file grants access only to files the user opens/creates with this
  // app, instead of the broad read-everything drive.readonly scope.
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive.file");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set({
    name: GOOGLE_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
