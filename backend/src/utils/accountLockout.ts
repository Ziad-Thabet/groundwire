import { redisConnection } from "../config/redis";

const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 15 * 60; // 15 minutes

function buildKey(email: string, ip: string): string {
  return `lockout:attempts:${email}:${ip}`;
}

/**
 * Returns the number of seconds remaining before the lockout clears,
 * or null if the account/IP pair is not currently locked out.
 */
export async function getLockoutRemainingSeconds(
  email: string,
  ip: string,
): Promise<number | null> {
  const key = buildKey(email, ip);
  const attempts = await redisConnection.get(key);

  if (attempts === null || Number(attempts) < MAX_ATTEMPTS) {
    return null;
  }

  const ttl = await redisConnection.ttl(key);
  return ttl > 0 ? ttl : null;
}

/**
 * Records a failed login attempt. Sets a TTL on the first failure so the
 * counter self-expires after the lockout window.
 */
export async function recordFailedAttempt(
  email: string,
  ip: string,
): Promise<void> {
  const key = buildKey(email, ip);
  const attempts = await redisConnection.incr(key);

  if (attempts === 1) {
    await redisConnection.expire(key, LOCKOUT_WINDOW_SECONDS);
  }
}

/**
 * Clears the failed-attempt counter after a successful login.
 */
export async function clearFailedAttempts(
  email: string,
  ip: string,
): Promise<void> {
  const key = buildKey(email, ip);
  await redisConnection.del(key);
}
