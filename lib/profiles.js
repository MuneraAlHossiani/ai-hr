import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { getRedis, hasUpstash } from "./redisClient";

const PROFILES_PATH = path.join(process.cwd(), "data", "profiles.csv");
const HEADER = ["email", "passwordHash"];
const PROFILES_KEY = "profiles";

function ensureDataDir() {
  const dir = path.dirname(PROFILES_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readProfilesLocal() {
  if (!fs.existsSync(PROFILES_PATH)) {
    return [];
  }
  const content = fs.readFileSync(PROFILES_PATH, "utf-8");
  if (!content.trim()) {
    return [];
  }
  return parse(content, { columns: true, skip_empty_lines: true });
}

export async function getProfileByEmail(email) {
  if (hasUpstash()) {
    const profile = await getRedis().hget(PROFILES_KEY, email);
    return profile || null;
  }
  const profiles = readProfilesLocal();
  return profiles.find((p) => p.email === email) || null;
}

export async function createProfile(email, passwordHash) {
  if (hasUpstash()) {
    await getRedis().hset(PROFILES_KEY, { [email]: { email, passwordHash } });
    return;
  }

  ensureDataDir();
  const fileExists = fs.existsSync(PROFILES_PATH);
  const row = stringify([[email, passwordHash]]);

  if (!fileExists) {
    const header = stringify([HEADER]);
    fs.writeFileSync(PROFILES_PATH, header + row);
  } else {
    fs.appendFileSync(PROFILES_PATH, row);
  }
}
