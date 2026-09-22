import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const COUNT_KEY = "yhatepdf:processed:count";
const TICK_KEY = "yhatepdf:processed:last-tick";
const TEN_MINUTES = 10 * 60 * 1000;

const LUA = `
local now = tonumber(ARGV[1])
local increment = tonumber(ARGV[2])
local last = tonumber(redis.call('GET', KEYS[2]))
if not last then
  redis.call('SET', KEYS[2], now)
  last = now
end
local ticks = math.floor((now - last) / ${TEN_MINUTES})
if ticks > 0 then
  redis.call('INCRBY', KEYS[1], ticks)
  redis.call('SET', KEYS[2], last + ticks * ${TEN_MINUTES})
end
if increment > 0 then redis.call('INCRBY', KEYS[1], increment) end
return tonumber(redis.call('GET', KEYS[1]) or '0')
`;

function redisConfig() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  };
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.method === "GET";
  return new Set([siteUrl, "https://yhatepdf.vercel.app", "http://localhost:5173"]).has(origin);
}

async function countWithGlobalTick(increment = 0) {
  const { url, token } = redisConfig();
  if (!url || !token) return { count: 0, configured: false };
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(["EVAL", LUA, 2, COUNT_KEY, TICK_KEY, Date.now(), increment]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("The global processed counter is temporarily unavailable.");
  const payload = await response.json() as { result?: unknown };
  return { count: typeof payload.result === "number" ? payload.result : Number(payload.result || 0), configured: true };
}

export async function GET(request: Request) {
  if (!allowedOrigin(request)) return Response.json({ error: "Not allowed" }, { status: 403 });
  try { return Response.json(await countWithGlobalTick(), { headers: { "cache-control": "no-store" } }); }
  catch { return Response.json({ count: 0, configured: true, error: "unavailable" }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) return Response.json({ error: "Not allowed" }, { status: 403 });
  try {
    const body = await request.json() as { amount?: unknown };
    const amount = typeof body.amount === "number" && Number.isFinite(body.amount) ? Math.max(1, Math.min(100, Math.floor(body.amount))) : 1;
    return Response.json(await countWithGlobalTick(amount), { headers: { "cache-control": "no-store" } });
  } catch { return Response.json({ count: 0, configured: true, error: "unavailable" }, { status: 503 }); }
}
