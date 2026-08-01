import { Redis } from "@upstash/redis";

let cachedRedis = null;
let cachedForUrl = null;

export function hasUpstash() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  if (!cachedRedis || cachedForUrl !== url) {
    cachedRedis = new Redis({ url, token });
    cachedForUrl = url;
  }
  return cachedRedis;
}
