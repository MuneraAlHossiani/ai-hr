import fs from "fs";
import path from "path";
import { redis, hasUpstash } from "./redisClient";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const DB_KEY = "db";

const ACTIVE_STATUSES = ["new", "screening", "interview", "offer"];

function ensureDataDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function readDb() {
  if (hasUpstash) {
    const data = await redis.get(DB_KEY);
    return data || {};
  }

  if (!fs.existsSync(DB_PATH)) {
    return {};
  }
  const content = fs.readFileSync(DB_PATH, "utf-8");
  if (!content.trim()) {
    return {};
  }
  return JSON.parse(content);
}

export async function writeDb(data) {
  if (hasUpstash) {
    await redis.set(DB_KEY, data);
    return;
  }

  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function getUserData(email) {
  const db = await readDb();
  return db[email] || null;
}

export async function createUserData(email, name, dob) {
  const db = await readDb();
  db[email] = { name, dob, jobs: {} };
  await writeDb(db);
  return db[email];
}

export async function createJob(email, title, description) {
  const db = await readDb();
  if (!db[email]) {
    throw new Error(`No user data found for ${email}`);
  }
  const id = "job_" + Date.now();
  const job = {
    id,
    title,
    description,
    createdAt: new Date().toISOString(),
    candidates: {},
  };
  db[email].jobs[id] = job;
  await writeDb(db);
  return job;
}

export async function getJob(email, jobId) {
  const db = await readDb();
  return db[email]?.jobs?.[jobId] || null;
}

export async function addCandidate(email, jobId, candidateData) {
  const db = await readDb();
  const job = db[email]?.jobs?.[jobId];
  if (!job) {
    throw new Error(`No job ${jobId} found for ${email}`);
  }
  const id = "cand_" + Date.now();
  const candidate = {
    id,
    status: "new",
    createdAt: new Date().toISOString(),
    ...candidateData,
  };
  job.candidates[id] = candidate;
  await writeDb(db);
  return candidate;
}

export async function updateCandidateStatus(email, jobId, candidateId, newStatus) {
  const db = await readDb();
  const job = db[email]?.jobs?.[jobId];
  if (!job) {
    throw new Error(`No job ${jobId} found for ${email}`);
  }
  const candidate = job.candidates[candidateId];
  if (!candidate) {
    throw new Error(`No candidate ${candidateId} found in job ${jobId}`);
  }

  candidate.status = newStatus;

  if (newStatus === "closed") {
    for (const otherId of Object.keys(job.candidates)) {
      if (otherId === candidateId) continue;
      const other = job.candidates[otherId];
      if (ACTIVE_STATUSES.includes(other.status)) {
        other.status = "rejected";
      }
    }
  }

  await writeDb(db);
  return candidate;
}
