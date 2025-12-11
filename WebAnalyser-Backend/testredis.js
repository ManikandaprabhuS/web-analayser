require('dotenv').config();
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function test() {
  try {
    await redis.set("test_key", "hello");
    const value = await redis.get("test_key");
    console.log("Redis OK:", value);
  } catch (err) {
    console.log("Redis ERROR:", err.message);
  }
}

test();
