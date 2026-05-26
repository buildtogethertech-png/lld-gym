export default function Content() {
  return (
    <>
      <p>Rate Limiter Low Level Design is a critical interview topic for platform engineering, API gateway, and backend roles. It tests your ability to model multiple algorithms — Token Bucket, Sliding Window Log, Fixed Window Counter — behind a clean interface using the Strategy pattern, and your understanding of distributed state and thread safety. This guide covers the complete rate limiter LLD solution with Java code.</p>

      <h2>Why Interviewers Ask Rate Limiter LLD</h2>
      <ul>
        <li>Can you abstract multiple algorithms behind a single interface?</li>
        <li>Do you understand the trade-offs between Token Bucket vs Sliding Window?</li>
        <li>Can you make it thread-safe without a global lock?</li>
        <li>Can you extend it for distributed rate limiting across multiple servers?</li>
        <li>Do you think about per-user vs global rate limits?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Allow or deny incoming requests based on a rate limit rule</li>
        <li>Support per-user, per-IP, and global rate limits</li>
        <li>Support multiple algorithms: Token Bucket, Fixed Window, Sliding Window Log</li>
        <li>Rate limit rules configurable at runtime (limit, window duration)</li>
        <li>Return remaining quota and retry-after time in the response</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Decisions in under 5ms — must not add significant latency to requests</li>
        <li>Thread-safe — multiple request threads checking limits concurrently</li>
        <li>For distributed: consistent rate limiting across multiple application instances</li>
      </ul>

      <h2>Core Entities</h2>
      <ul>
        <li><strong>RateLimiter</strong> — main entry point; delegates to a RateLimitStrategy</li>
        <li><strong>RateLimitStrategy</strong> — interface; TokenBucket, FixedWindow, SlidingWindowLog implement it</li>
        <li><strong>RateLimitRule</strong> — limit (max requests), windowDuration, identifier (userId/IP)</li>
        <li><strong>RateLimitResult</strong> — allowed: boolean, remaining: int, retryAfterMs: long</li>
        <li><strong>BucketStore</strong> — stores per-user state (token count, window timestamps)</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`RateLimiter
+-- strategy: RateLimitStrategy
+-- isAllowed(userId, rule): RateLimitResult

RateLimitStrategy (interface)
+-- isAllowed(userId, rule): RateLimitResult

TokenBucketStrategy    implements RateLimitStrategy
FixedWindowStrategy    implements RateLimitStrategy
SlidingWindowStrategy  implements RateLimitStrategy

RateLimitRule
+-- maxRequests: int
+-- windowDurationMs: long
+-- identifier: String

RateLimitResult
+-- allowed: boolean
+-- remaining: int
+-- retryAfterMs: long`}</pre>

      <h2>Token Bucket Algorithm — Java</h2>
      <pre>{`public class TokenBucketStrategy implements RateLimitStrategy {
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public synchronized RateLimitResult isAllowed(String userId, RateLimitRule rule) {
        Bucket bucket = buckets.computeIfAbsent(userId,
            k -> new Bucket(rule.getMaxRequests(), rule.getWindowDurationMs()));
        bucket.refill();
        if (bucket.getTokens() >= 1) {
            bucket.consume();
            return new RateLimitResult(true, (int) bucket.getTokens(), 0);
        }
        return new RateLimitResult(false, 0, bucket.getRetryAfterMs());
    }

    private static class Bucket {
        private double tokens;
        private final double maxTokens;
        private final double refillRatePerMs;
        private long lastRefillTime;

        Bucket(int maxTokens, long windowMs) {
            this.maxTokens = maxTokens;
            this.tokens = maxTokens;
            this.refillRatePerMs = (double) maxTokens / windowMs;
            this.lastRefillTime = System.currentTimeMillis();
        }

        void refill() {
            long now = System.currentTimeMillis();
            double tokensToAdd = (now - lastRefillTime) * refillRatePerMs;
            tokens = Math.min(maxTokens, tokens + tokensToAdd);
            lastRefillTime = now;
        }

        void consume() { tokens -= 1; }
        double getTokens() { return tokens; }
        long getRetryAfterMs() { return (long) ((1 - tokens) / refillRatePerMs); }
    }
}`}</pre>

      <h2>Fixed Window Counter</h2>
      <pre>{`public class FixedWindowStrategy implements RateLimitStrategy {
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    public synchronized RateLimitResult isAllowed(String userId, RateLimitRule rule) {
        WindowCounter counter = counters.computeIfAbsent(userId,
            k -> new WindowCounter(rule.getWindowDurationMs()));
        long now = System.currentTimeMillis();
        counter.resetIfExpired(now, rule.getWindowDurationMs());

        if (counter.getCount() < rule.getMaxRequests()) {
            counter.increment();
            return new RateLimitResult(true, rule.getMaxRequests() - counter.getCount(), 0);
        }
        long retryAfter = counter.getWindowStart() + rule.getWindowDurationMs() - now;
        return new RateLimitResult(false, 0, retryAfter);
    }

    private static class WindowCounter {
        private int count = 0;
        private long windowStart;

        WindowCounter(long windowMs) { this.windowStart = System.currentTimeMillis(); }
        void resetIfExpired(long now, long windowMs) {
            if (now - windowStart >= windowMs) { count = 0; windowStart = now; }
        }
        void increment() { count++; }
        int getCount() { return count; }
        long getWindowStart() { return windowStart; }
    }
}`}</pre>

      <h2>Sliding Window Log Algorithm</h2>
      <pre>{`public class SlidingWindowLogStrategy implements RateLimitStrategy {
    private final Map<String, Deque<Long>> requestLogs = new ConcurrentHashMap<>();

    @Override
    public synchronized RateLimitResult isAllowed(String userId, RateLimitRule rule) {
        long now = System.currentTimeMillis();
        long windowStart = now - rule.getWindowDurationMs();

        Deque<Long> log = requestLogs.computeIfAbsent(userId, k -> new ArrayDeque<>());

        // Remove timestamps outside the window
        while (!log.isEmpty() && log.peekFirst() <= windowStart) log.pollFirst();

        if (log.size() < rule.getMaxRequests()) {
            log.addLast(now);
            return new RateLimitResult(true, rule.getMaxRequests() - log.size(), 0);
        }
        long retryAfter = log.peekFirst() + rule.getWindowDurationMs() - now;
        return new RateLimitResult(false, 0, retryAfter);
    }
}`}</pre>

      <h2>Algorithm Comparison</h2>
      <ul>
        <li><strong>Token Bucket:</strong> Allows bursts up to bucket size. Smooth refill. Best for APIs that need burst tolerance. Most widely used in practice (AWS API Gateway, Stripe).</li>
        <li><strong>Fixed Window:</strong> Simple. But allows 2x the limit at window boundaries (last request of window N + first requests of window N+1). Use for non-critical limits.</li>
        <li><strong>Sliding Window Log:</strong> Most accurate. No boundary problem. But stores a timestamp per request — high memory for bursty traffic. Use when precision matters.</li>
        <li><strong>Sliding Window Counter:</strong> Hybrid — Fixed Window with a weighted count from the previous window. Approximates sliding window with O(1) memory.</li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li><strong>"How do you rate limit across multiple servers?"</strong> — Store state in Redis with atomic operations (INCR for fixed window, sorted sets for sliding window log). Each server checks Redis instead of local memory.</li>
        <li><strong>"How do you handle Redis failure?"</strong> — Fail open (allow requests) or fail closed (deny requests) based on the use case. Most APIs fail open with a fallback local limiter.</li>
        <li><strong>"How do you support per-endpoint rate limits?"</strong> — The key becomes userId:endpoint instead of just userId. RateLimitRule carries the endpoint as part of the identifier.</li>
      </ul>

      <h2>FAQ — Rate Limiter Low Level Design</h2>

      <h3>What is the best algorithm for rate limiting?</h3>
      <p>Token Bucket is the most practical — it allows bursts, has a smooth refill, and is O(1) time and O(1) space per user. Sliding Window Log is the most accurate but O(n) space per user where n is the request count per window.</p>

      <h3>How does Token Bucket work?</h3>
      <p>A bucket holds tokens up to a maximum capacity. Tokens refill at a constant rate. Each request consumes one token. If the bucket is empty, the request is denied. Burst requests are handled by the accumulated tokens.</p>

      <h3>How do you make a rate limiter distributed?</h3>
      <p>Store bucket state in Redis using atomic operations. For Token Bucket, use a Lua script to atomically check tokens and consume one. For Fixed Window, use Redis INCR with an expiry. For Sliding Window, use a Redis sorted set with timestamps as scores.</p>
    </>
  );
}
