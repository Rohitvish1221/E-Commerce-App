import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// export const redis = new Redis(process.env.UPSTASH_REDIS_URL);

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: {}, // Important for Upstash — it uses secure TLS connection (rediss)
  maxRetriesPerRequest: null, // Prevents MaxRetriesPerRequestError
});

redis.on("connect", () => console.log("✅ Connected to Upstash Redis"));
redis.on("error", (err) => console.error("❌ Redis Error:", err));
