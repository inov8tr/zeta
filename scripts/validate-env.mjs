#!/usr/bin/env node
import { exit } from "node:process";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";

const envFiles = [".env.local", ".env"];
for (const file of envFiles) {
  const fullPath = join(process.cwd(), file);
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath, override: false });
  }
}

if (process.env.SKIP_ENV_VALIDATION === "1") {
  console.info("Skipping env validation because SKIP_ENV_VALIDATION=1");
  exit(0);
}

const requiredPublic = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const missing = requiredPublic.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  exit(1);
}

const parseJwtRef = (token, label) => {
  const parts = token.split(".");
  if (parts.length < 2) {
    console.error(`${label} does not look like a valid JWT.`);
    exit(1);
  }
  const payload = parts[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  try {
    const json = Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    if (!parsed.ref) {
      console.error(`${label} payload does not include a Supabase project ref.`);
      exit(1);
    }
    return parsed.ref;
  } catch (error) {
    console.error(`Unable to decode ${label}:`, error instanceof Error ? error.message : error);
    exit(1);
  }
};

const ensureMatchingRefs = (expectedRef, actualRef, source) => {
  if (expectedRef && actualRef && expectedRef !== actualRef) {
    console.error(
      `Supabase project ref mismatch: expected ${expectedRef} but found ${actualRef} from ${source}.\n` +
        "Update your Supabase environment variables so the URL host and all keys use the same project ref."
    );
    exit(1);
  }
};

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let url;
try {
  url = new URL(publicUrl);
} catch (error) {
  console.error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${publicUrl}`);
  exit(1);
}

if (!url.hostname.endsWith(".supabase.co")) {
  console.error("NEXT_PUBLIC_SUPABASE_URL must point to a *.supabase.co domain.");
  exit(1);
}

const hostRef = url.hostname.split(".")[0];
const anonRef = parseJwtRef(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
ensureMatchingRefs(hostRef, anonRef, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (process.env.SUPABASE_URL) {
  let serverUrl;
  try {
    serverUrl = new URL(process.env.SUPABASE_URL);
  } catch (error) {
    console.error(`SUPABASE_URL is not a valid URL: ${process.env.SUPABASE_URL}`);
    exit(1);
  }
  if (!serverUrl.hostname.endsWith(".supabase.co")) {
    console.error("SUPABASE_URL must point to a *.supabase.co domain.");
    exit(1);
  }
  const serverRef = serverUrl.hostname.split(".")[0];
  ensureMatchingRefs(hostRef, serverRef, "SUPABASE_URL");
}

if (process.env.SUPABASE_ANON_KEY) {
  const serverAnonRef = parseJwtRef(process.env.SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY");
  ensureMatchingRefs(hostRef, serverAnonRef, "SUPABASE_ANON_KEY");
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const serviceRef = parseJwtRef(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  ensureMatchingRefs(hostRef, serviceRef, "SUPABASE_SERVICE_ROLE_KEY");
}

console.info("Supabase environment variables look consistent.");
