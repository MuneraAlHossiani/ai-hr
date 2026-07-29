import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const PROFILES_PATH = path.join(process.cwd(), "data", "profiles.csv");
const HEADER = ["email", "passwordHash"];

function ensureDataDir() {
  const dir = path.dirname(PROFILES_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readProfiles() {
  if (!fs.existsSync(PROFILES_PATH)) {
    return [];
  }
  const content = fs.readFileSync(PROFILES_PATH, "utf-8");
  if (!content.trim()) {
    return [];
  }
  return parse(content, { columns: true, skip_empty_lines: true });
}

export function getProfileByEmail(email) {
  const profiles = readProfiles();
  return profiles.find((p) => p.email === email) || null;
}

export function createProfile(email, passwordHash) {
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
