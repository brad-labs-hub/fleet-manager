#!/usr/bin/env node
/**
 * List environment variable **names** in a Vercel project (no values).
 * Uses the REST API so you can review names vs this repo’s inventory.
 *
 * Required (see https://vercel.com/docs/rest-api#authentication):
 *   export VERCEL_TOKEN=        # from Vercel → Account → Tokens
 *   export VERCEL_PROJECT_ID=  # e.g. prj_... or run `vercel link` to create .vercel/project.json
 *   export VERCEL_ORG_ID=      # team id team_... (or omit for personal account - try empty)
 *
 * @see https://vercel.com/kb/bulletin/vercel-april-2026-security-incident
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadVercelProjectJson() {
  const f = join(root, ".vercel", "project.json");
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const token = process.env.VERCEL_TOKEN?.trim();
  let projectId = process.env.VERCEL_PROJECT_ID?.trim();
  const team = process.env.VERCEL_ORG_ID?.trim() || null;

  const linked = loadVercelProjectJson();
  if (!projectId && linked?.projectId) {
    projectId = linked.projectId;
  }
  if (!projectId) {
    console.error(
      "Set VERCEL_PROJECT_ID or run `vercel link` in this repository so .vercel/project.json exists."
    );
    process.exit(1);
  }
  if (!token) {
    console.error("Set VERCEL_TOKEN (Vercel → Account → Tokens).");
    process.exit(1);
  }

  const qs = new URLSearchParams();
  if (team) qs.set("teamId", team);
  const url = `https://api.vercel.com/v9/projects/${projectId}/env?${qs}`;

  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Vercel API ${r.status}: ${t.slice(0, 400)}`);
  }
  const j = await r.json();
  const items = j.envs ?? [];
  const names = [...new Set(items.map((e) => e.key))].sort();
  console.log("Vercel project:", projectId, team ? `team=${team}` : "(personal or default team)");
  console.log("Count:", names.length);
  for (const n of names) console.log(n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
