// queue.js
require('dotenv').config();
const { Redis } = require('@upstash/redis');
const { v4: uuidv4 } = require('uuid');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const QUEUE_KEY = 'audit_jobs_queue';   // list of job IDs (FIFO)
const JOB_KEY_PREFIX = 'audit_job:';    // job hash prefix

// Enqueue a new job
async function enqueueAuditJob(payload) {
  const jobId = uuidv4();

  const jobData = {
    id: jobId,
    status: 'queued',        // queued | processing | completed | failed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload,                 // { url, email, type }
    error: null,
    resultSummary: null,
  };

  // Store job object
  await redis.set(JOB_KEY_PREFIX + jobId, jobData);

  // Push job ID into queue list (right side — FIFO)
  await redis.rpush(QUEUE_KEY, jobId);

  return jobId;
}

// Read job status
async function getJobStatus(jobId) {
  return redis.get(JOB_KEY_PREFIX + jobId);
}

// Update job
async function updateJobStatus(jobId, updates) {
  const key = JOB_KEY_PREFIX + jobId;
  const job = await redis.get(key);
  if (!job) return null;

  const updated = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(key, updated);
  return updated;
}

// Worker: pop next job from queue
async function popNextJob() {
  const jobId = await redis.lpop(QUEUE_KEY);
  if (!jobId) return null;
  const job = await redis.get(JOB_KEY_PREFIX + jobId);
  return job;
}

module.exports = {
  enqueueAuditJob,
  getJobStatus,
  updateJobStatus,
  popNextJob,
};
