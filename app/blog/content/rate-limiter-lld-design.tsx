export default function Content() {
  return (
    <>
      <p>Rate Limiter is a favorite LLD problem at companies that run high-traffic APIs. It tests your knowledge of multiple algorithms, distributed systems, and the Strategy pattern. Here's how to design it in an interview.</p>
      <h2>Four Algorithms You Must Know</h2>
      <h3>1. Fixed Window Counter</h3>
      <pre>{`// Count requests in a fixed time window (e.g., 100 req/min)
class FixedWindowLimiter implements RateLimitStrategy {
  check(userId: string): boolean {
    const windowKey = \`\${userId}:\${Math.floor(Date.now() / 60000)}\`;
    const count = this.store.increment(windowKey);
    if (count === 1) this.store.expire(windowKey, 60);
    return count <= this.limit;
  }
}`}</pre>
      <p><strong>Problem:</strong> Boundary burst — user can fire 200 requests at 11:59 + 12:00</p>
      <h3>2. Sliding Window Log</h3>
      <pre>{`// Store timestamp of every request in a sorted set
class SlidingWindowLogLimiter implements RateLimitStrategy {
  check(userId: string): boolean {
    const now = Date.now();
    this.store.removeOlderThan(userId, now - 60000);
    const count = this.store.count(userId);
    if (count >= this.limit) return false;
    this.store.add(userId, now);
    return true;
  }
}`}</pre>
      <h3>3. Token Bucket (supports burst)</h3>
      <pre>{`class TokenBucketLimiter implements RateLimitStrategy {
  check(userId: string): boolean {
    const bucket = this.getBucket(userId);
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillRate);
    bucket.lastRefill = now;
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  }
}`}</pre>
      <h3>4. Leaky Bucket (smooth output)</h3>
      <p>Requests queue up; processed at a fixed rate. Excess requests are dropped. Use when you need smooth, predictable throughput.</p>
      <h2>Strategy Pattern for Algorithm Selection</h2>
      <pre>{`interface RateLimitStrategy { check(userId: string): boolean; }

class RateLimiter {
  constructor(private strategy: RateLimitStrategy) {}
  isAllowed(userId: string): LimitResult {
    const allowed = this.strategy.check(userId);
    return { allowed, remaining: this.strategy.getRemaining(userId), retryAfter: allowed ? 0 : this.strategy.getRetryAfter(userId) };
  }
}`}</pre>
      <h2>Layered Limits with Decorator</h2>
      <pre>{`// Global limit + per-user limit + per-endpoint limit
const limiter = new EndpointLimiter(
  new UserLimiter(
    new GlobalLimiter(baseStrategy, 10000),  // 10k global req/s
    1000                                      // 1k per-user req/s
  ),
  "/api/search",
  100                                         // 100 search req/s
);`}</pre>
    </>
  );
}
