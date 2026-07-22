import { redisConnection } from "../config/redis";

const WORKSPACE_CONCURRENCY_LIMIT = 3;

// Safety TTL: if a worker crashes mid-job without releasing its slot,
// the counter self-heals after this window rather than staying stuck
// forever. Comfortably longer than any realistic document processing time.
const SLOT_TTL_SECONDS = 600; // 10 minutes

function slotKey(workspaceId: string): string {
  return `ws-concurrency:${workspaceId}`;
}

// Atomically: increment the counter, and if it now exceeds the limit,
// immediately decrement back and report failure -- all in one Redis
// round-trip so concurrent callers can't both slip past the check.
const ACQUIRE_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local current = redis.call("INCR", key)
if current > limit then
  redis.call("DECR", key)
  return 0
end
redis.call("EXPIRE", key, ttl)
return 1
`;

/**
 * Attempts to acquire one of WORKSPACE_CONCURRENCY_LIMIT processing slots
 * for the given workspace. Returns true if acquired (caller must call
 * releaseWorkspaceSlot when done, success or failure), false if the
 * workspace is already at its concurrency limit.
 */
export async function acquireWorkspaceSlot(
  workspaceId: string,
): Promise<boolean> {
  const result = await redisConnection.eval(
    ACQUIRE_SCRIPT,
    1,
    slotKey(workspaceId),
    WORKSPACE_CONCURRENCY_LIMIT,
    SLOT_TTL_SECONDS,
  );
  return result === 1;
}

/**
 * Releases a previously acquired slot. Safe to call even if the counter
 * is already at 0 (e.g. due to TTL expiry) -- floors at 0 rather than
 * going negative.
 */
export async function releaseWorkspaceSlot(
  workspaceId: string,
): Promise<void> {
  const key = slotKey(workspaceId);
  const current = await redisConnection.decr(key);
  if (current < 0) {
    // Guard against TTL expiry + release racing to a negative count.
    await redisConnection.set(key, 0);
  }
}
