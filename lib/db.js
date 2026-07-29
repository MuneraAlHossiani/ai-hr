import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const ACTIVE_STATUSES = ["new", "screening", "interview", "offer"];

function ensureDataDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return {};
  }
  const content = fs.readFileSync(DB_PATH, "utf-8");
  if (!content.trim()) {
    return {};
  }
  return JSON.parse(content);
}

export function writeDb(data) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getUserData(email) {
  const db = readDb();
  return db[email] || null;
}

export function createUserData(email, name, dob) {
  const db = readDb();
  db[email] = { name, dob, jobs: {} };
  writeDb(db);
  return db[email];
}

export function createJob(email, title, description) {
  const db = readDb();
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
  writeDb(db);
  return job;
}

export function getJob(email, jobId) {
  const db = readDb();
  return db[email]?.jobs?.[jobId] || null;
}

export function addCandidate(email, jobId, candidateData) {
  const db = readDb();
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
  writeDb(db);
  return candidate;
}

export function updateCandidateStatus(email, jobId, candidateId, newStatus) {
  const db = readDb();
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

  writeDb(db);
  return candidate;
}
