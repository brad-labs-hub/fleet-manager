#!/usr/bin/env node
/**
 * Create new Supabase API Keys (publishable + secret) for April 2026 Vercel incident rotation.
 * Old sb_* keys can be removed after you update Vercel + redeploy and verify.
 *
 * Usage:
 *   node scripts/supabase-rotate-api-keys.mjs
 *   node scripts/supabase-rotate-api-keys.mjs --revoke 3ba6e0a0-...,13228c8f-...
 *
 * Token: SUPABASE_ACCESS_TOKEN, or same macOS keychain as `supabase login`.
 *
 * @see https://supabase.com/docs/guides/api/api-keys
 * @see https://vercel.com/kb/bulletin/vercel-april-2026-security-incident
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getSupabaseAccessToken } from "./lib/supabase-access-token.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function readProjectRef() {
  const p = join(root, "supabase", ".temp", "project-ref");
  return readFileSync(p, "utf8").trim();
}

const API = "https://api.supabase.com/v1";

async function managementFetch(token, ref, pathAndQuery, opts = {}) {
  const url = `${API}/projects/${ref}${pathAndQuery}`;
  const isJson = opts.body != null;
  const r = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...opts.headers,
    },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Supabase API ${r.status}: ${t.slice(0, 500)}`);
  }
  const text = await r.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function listKeysJson(token, ref) {
  return managementFetch(
    token,
    ref,
    "/api-keys?reveal=true",
    { method: "GET" }
  );
}

async function createKey(token, ref, type, name) {
  return managementFetch(token, ref, "/api-keys?reveal=true", {
    method: "POST",
    body: JSON.stringify({ type, name, description: "April 2026 security rotation" }),
  });
}

async function deleteKey(token, ref, id) {
  return managementFetch(
    token,
    ref,
    `/api-keys/${encodeURIComponent(id)}?was_compromised=true&reason=vercel%20april%202026%20rotation`,
    { method: "DELETE" }
  );
}

function parseArgs() {
  const a = process.argv.slice(2);
  let revoke;
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith("--revoke=")) {
      revoke = a[i].slice("--revoke=".length);
    } else if (a[i] === "--revoke" && a[i + 1]) {
      revoke = a[i + 1];
      i++;
    }
  }
  return {
    revokeIds: revoke
      ? revoke.split(",").map((s) => s.trim()).filter(Boolean)
      : null,
  };
}

async function main() {
  const token = getSupabaseAccessToken();
  if (!token) {
    console.error(
      "Create a Personal access token (Management API) at:\n" +
        "  https://supabase.com/dashboard/account/tokens\n" +
        "Then: export SUPABASE_ACCESS_TOKEN=...\n" +
        "Note: the CLI `supabase login` token is not always accepted; use a PAT for this script."
    );
    process.exit(1);
  }

  const projectRef = readProjectRef();
  const { revokeIds } = parseArgs();

  if (revokeIds?.length) {
    for (const id of revokeIds) {
      if (id === "anon" || id === "service_role") {
        console.error(
          "Refusing to delete legacy key id anon/service_role. Rotate JWT in Dashboard if needed, or stop using legacy keys in your app first."
        );
        process.exit(1);
      }
      await deleteKey(token, projectRef, id);
      console.log("Revoked key:", id);
    }
    return;
  }

  const list = await listKeysJson(token, projectRef);
  const hasNew = (k) => k.type === "publishable" || k.type === "secret";
  const nameSuffix = new Date().toISOString().slice(0, 10);
  const pub = await createKey(
    token,
    projectRef,
    "publishable",
    `web-${nameSuffix}-rotation`
  );
  const sec = await createKey(
    token,
    projectRef,
    "secret",
    `server-${nameSuffix}-rotation`
  );

  const publishable = pub.api_key;
  const serviceSecret = sec.api_key;

  console.log("");
  console.log("=== Add or replace in Vercel (mark Sensitive) and in .env.local ===");
  console.log("");
  console.log("NEXT_PUBLIC_SUPABASE_URL=" + `https://${projectRef}.supabase.co`);
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY=" + publishable);
  console.log("SUPABASE_SERVICE_ROLE_KEY=" + serviceSecret);
  console.log("");
  const rotatable = list.filter(
    (k) => hasNew(k) && k.id !== pub.id && k.id !== sec.id
  );
  if (rotatable.length) {
    console.log(
      "When production is updated and healthy, revoke previous publishable/secret by id (comma-separated):"
    );
    console.log(
      "  node scripts/supabase-rotate-api-keys.mjs --revoke " +
        rotatable.map((k) => k.id).join(",")
    );
  }
  console.log("");
  console.log(
    "If you use Resend in Supabase Auth SMTP, update that key in the Supabase Dashboard as well (same rotation doc)."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
