#!/usr/bin/env node
/**
 * Single inventory of every secret / env name referenced by this app for April 2026 rotation.
 * No network; compare output to your Vercel project and provider dashboards.
 */

const INVENTORY = {
  "Required (Vercel + .env.local)": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
  ],
  "Optional — OAuth (cloud import)": [
    "NEXT_PUBLIC_ONEDRIVE_CLIENT_ID",
    "ONEDRIVE_CLIENT_SECRET",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ],
  "Optional — product integrations": [
    "RESEND_API_KEY",
    "ANTHROPIC_API_KEY",
    "CARSXE_API_KEY",
  ],
  "Optional — operations": [
    "HEALTHCHECK_TOKEN",
    "ALERT_WEBHOOK_URL",
  ],
  "Local / DB tooling only (rotate if it was ever in Vercel or leaked)": [
    "DATABASE_URL",
    "SUPABASE_DB_PASSWORD",
  ],
};

const THIRD_PARTY = [
  { varName: "RESEND_API_KEY", url: "https://resend.com/api-keys" },
  { varName: "ANTHROPIC_API_KEY", url: "https://console.anthropic.com/" },
  { varName: "CARSXE_API_KEY", url: "https://api.carsxe.com/ (or your provider dashboard)" },
  {
    varName: "GOOGLE_CLIENT_SECRET / OAuth",
    url: "https://console.cloud.google.com/apis/credentials",
  },
  {
    varName: "ONEDRIVE_CLIENT_SECRET / Azure",
    url: "https://portal.azure.com/ → App registrations",
  },
];

const OPTIONAL_DB =
  "Only rotate the Supabase **database user password** or **JWT signing** secret in the Supabase " +
  "Dashboard if that credential was in Vercel or your policy requires it. " +
  "Rotating the JWT secret logs users out. See: " +
  "https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd";

for (const [section, keys] of Object.entries(INVENTORY)) {
  console.log(`\n## ${section}\n`);
  for (const k of keys) console.log(`  - ${k}`);
}

console.log("\n## Third-party dashboards (regenerate, then re-paste to Vercel as Sensitive)\n");
for (const t of THIRD_PARTY) {
  console.log(`  - ${t.varName} → ${t.url}`);
}

console.log("\n## Optional: database password / JWT\n");
console.log(`  ${OPTIONAL_DB}\n`);
