// keepalive.js
import Redis from "ioredis";

(async () => {
  // Render Cron Jobs expose environment variables directly,
  // so we read UPSTASH_REDIS_URL from process.env
  const url = process.env.UPSTASH_REDIS_URL;
  if (!url) {
    console.error("❌ UPSTASH_REDIS_URL not set");
    process.exit(1);
  }

  const redis = new Redis(url, {
    tls: {},                // required for Upstash rediss://
    maxRetriesPerRequest: 3 // small retry before failing
  });

  try {
    const res = await redis.ping();
    console.log("✅ Upstash PING response:", res); // should be "PONG"
    process.exit(0);
  } catch (err) {
    console.error("❌ Redis ping failed:", err && err.message ? err.message : err);
    process.exit(2);
  } finally {
    try { await redis.quit(); } catch (_) { redis.disconnect(); }
  }
})();
