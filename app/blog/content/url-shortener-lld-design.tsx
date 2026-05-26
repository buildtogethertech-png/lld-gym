export default function Content() {
  return (
    <>
      <p>
        URL Shortener (bit.ly / TinyURL) is a classic Low Level Design and System Design interview problem
        that tests encoding algorithms, clean API design, and analytics tracking. It is asked at Google,
        Microsoft, Amazon, and most product-based companies. This guide covers the complete LLD solution
        with Base62 encoding, custom aliases, TTL support, click analytics, and Java code.
      </p>

      <h2>Why Interviewers Ask URL Shortener LLD</h2>
      <p>
        The URL shortener is deceptively simple — the interesting parts emerge when the interviewer adds
        requirements. Interviewers want to see:
      </p>
      <ul>
        <li>Can you design a collision-free, unique short code generation algorithm?</li>
        <li>Do you handle custom aliases, TTL expiry, and click analytics cleanly?</li>
        <li>Can you design the class hierarchy — UrlMapping, ShortCodeGenerator, AnalyticsService?</li>
        <li>Do you think about caching for read-heavy workloads (99% reads, 1% writes)?</li>
        <li>Can you prevent abuse — rate limiting, max URL length, banned domains?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Given a long URL, generate a unique short code (e.g., abc123)</li>
        <li>User can optionally provide a custom alias (e.g., my-promo)</li>
        <li>Short URL redirects to the original long URL</li>
        <li>Short URLs expire after a configurable TTL (default: never)</li>
        <li>Track click count per short URL</li>
        <li>Track referrer, device type, and geographic location per click (analytics)</li>
        <li>User can delete or update their short URLs</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Redirect latency must be under 10ms — serve from cache, not DB</li>
        <li>Short codes must be unique — no two long URLs share the same code</li>
        <li>System must handle 1000 redirects/second per node</li>
        <li>Expired URLs must return 410 Gone, not silently redirect</li>
      </ul>

      <h2>Core Entities — URL Shortener LLD Class Design</h2>
      <ul>
        <li><strong>UrlMapping</strong> — shortCode, longUrl, userId, createdAt, expiresAt, clickCount</li>
        <li><strong>User</strong> — id, email, plan (FREE/PRO), rateLimitTokens</li>
        <li><strong>ClickEvent</strong> — shortCode, timestamp, referrer, deviceType, country</li>
        <li><strong>ShortCodeGenerator</strong> — interface; Base62Generator, HashGenerator implement it</li>
        <li><strong>UrlShorteningService</strong> — create, resolve, delete URLs</li>
        <li><strong>AnalyticsService</strong> — record click events, aggregate stats</li>
        <li><strong>CacheService</strong> — in-memory or Redis cache for shortCode → longUrl</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`UrlMapping
+-- shortCode: String  (6 chars, Base62)
+-- longUrl: String
+-- userId: String
+-- createdAt: LocalDateTime
+-- expiresAt: LocalDateTime  (nullable)
+-- clickCount: AtomicLong

User
+-- id, email, plan: UserPlan
+-- urlsCreated: int
+-- dailyLimit: int

ClickEvent
+-- shortCode, referrer, deviceType, country
+-- timestamp: LocalDateTime

ShortCodeGenerator (interface)
+-- generate(longUrl): String

Base62Generator implements ShortCodeGenerator
HashGenerator   implements ShortCodeGenerator

UrlShorteningService
+-- shorten(request, userId): UrlMapping
+-- resolve(shortCode): String  // returns longUrl
+-- delete(shortCode, userId): void

AnalyticsService
+-- recordClick(shortCode, clickEvent): void
+-- getStats(shortCode): UrlStats

CacheService
+-- get(shortCode): Optional<String>
+-- put(shortCode, longUrl, ttl): void
+-- evict(shortCode): void`}</pre>

      <h2>Base62 Encoding — Java</h2>
      <p>
        Base62 uses characters 0-9, a-z, A-Z (62 characters). A 6-character Base62 string gives
        62^6 = 56 billion unique combinations — enough for any URL shortener.
      </p>
      <pre>{`public class Base62Generator implements ShortCodeGenerator {
    private static final String CHARSET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = 62;
    private static final int CODE_LENGTH = 6;

    private final AtomicLong counter; // global counter, backed by DB or Redis

    public Base62Generator(AtomicLong counter) {
        this.counter = counter;
    }

    @Override
    public String generate(String longUrl) {
        long id = counter.incrementAndGet();
        return encode(id);
    }

    private String encode(long num) {
        StringBuilder sb = new StringBuilder();
        while (num > 0) {
            sb.append(CHARSET.charAt((int)(num % BASE)));
            num /= BASE;
        }
        while (sb.length() < CODE_LENGTH) sb.append('0');
        return sb.reverse().toString();
    }
}

// Alternative: hash-based (no global counter needed)
public class HashGenerator implements ShortCodeGenerator {
    @Override
    public String generate(String longUrl) {
        String hash = DigestUtils.md5Hex(longUrl + System.nanoTime());
        return hash.substring(0, 6); // take first 6 chars
    }
}`}</pre>

      <h2>UrlShorteningService — Core Logic</h2>
      <pre>{`public class UrlShorteningService {
    private final ShortCodeGenerator generator;
    private final UrlMappingRepository repo;
    private final CacheService cache;
    private static final int MAX_RETRY = 3;

    public UrlMapping shorten(ShortenRequest req, String userId) {
        // Custom alias
        if (req.getCustomAlias() != null) {
            if (repo.existsByShortCode(req.getCustomAlias()))
                throw new AliasAlreadyTakenException(req.getCustomAlias());
            return save(req.getCustomAlias(), req.getLongUrl(), userId, req.getTtlDays());
        }

        // Generated code — retry on collision (rare with Base62 counter)
        for (int attempt = 0; attempt < MAX_RETRY; attempt++) {
            String code = generator.generate(req.getLongUrl());
            if (!repo.existsByShortCode(code)) {
                return save(code, req.getLongUrl(), userId, req.getTtlDays());
            }
        }
        throw new CodeGenerationException("Failed to generate unique code after " + MAX_RETRY + " attempts");
    }

    private UrlMapping save(String code, String longUrl, String userId, Integer ttlDays) {
        LocalDateTime expiry = ttlDays != null
            ? LocalDateTime.now().plusDays(ttlDays) : null;
        UrlMapping mapping = new UrlMapping(code, longUrl, userId, LocalDateTime.now(), expiry);
        repo.save(mapping);
        if (expiry != null) {
            cache.put(code, longUrl, Duration.ofDays(ttlDays));
        } else {
            cache.put(code, longUrl, Duration.ofDays(30)); // cache for 30 days
        }
        return mapping;
    }

    public String resolve(String shortCode) {
        // Cache-first
        Optional<String> cached = cache.get(shortCode);
        if (cached.isPresent()) return cached.get();

        UrlMapping mapping = repo.findByShortCode(shortCode)
            .orElseThrow(() -> new UrlNotFoundException(shortCode));

        if (mapping.isExpired())
            throw new UrlExpiredException(shortCode); // return 410 Gone

        cache.put(shortCode, mapping.getLongUrl(), Duration.ofDays(1));
        return mapping.getLongUrl();
    }
}`}</pre>

      <h2>Click Analytics</h2>
      <pre>{`public class AnalyticsService {
    private final ClickEventRepository clickRepo;

    public void recordClick(String shortCode, HttpServletRequest httpReq) {
        ClickEvent event = ClickEvent.builder()
            .shortCode(shortCode)
            .referrer(httpReq.getHeader("Referer"))
            .deviceType(parseDeviceType(httpReq.getHeader("User-Agent")))
            .country(geoService.getCountry(httpReq.getRemoteAddr()))
            .timestamp(LocalDateTime.now())
            .build();
        clickRepo.save(event); // async, non-blocking
    }

    public UrlStats getStats(String shortCode) {
        long totalClicks = clickRepo.countByShortCode(shortCode);
        Map<String, Long> byCountry = clickRepo.groupByCountry(shortCode);
        Map<String, Long> byDevice = clickRepo.groupByDevice(shortCode);
        return new UrlStats(shortCode, totalClicks, byCountry, byDevice);
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Counter-based Base62 over MD5 hash:</strong> Hash-based generation requires a collision
          check on every creation. Counter-based is collision-free by construction — each ID is unique.
          The tradeoff: the counter is a single point of coordination (use Redis INCR for distributed
          systems).
        </li>
        <li>
          <strong>Cache-first resolve:</strong> 99% of traffic is redirects, not creation. Serve the
          longUrl from Redis cache. Only query the DB on a cache miss. This keeps redirect latency
          under 5ms even at high throughput.
        </li>
        <li>
          <strong>Async click recording:</strong> Recording a click event should never be on the critical
          path of a redirect. Use a message queue (Kafka, SQS) or async thread pool to write click events
          without adding latency to the redirect response.
        </li>
        <li>
          <strong>410 Gone vs 404 for expired URLs:</strong> HTTP 410 signals that the resource existed
          but is permanently gone. This is semantically correct for expired URLs and tells crawlers not
          to re-index the path.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you prevent the same long URL from getting two short codes?"</strong> — Add an
          index on longUrl in the DB. On shorten, first check if the URL already has a code for this user.
          Return the existing code to avoid duplicates. This is optional — bit.ly allows multiple codes
          for the same URL.
        </li>
        <li>
          <strong>"How do you handle 1 billion URLs?"</strong> — Use a distributed counter (Redis INCR
          with namespace) instead of an auto-increment DB column. Partition the UrlMapping table by
          shortCode prefix. Use consistent hashing to route requests to the right shard.
        </li>
        <li>
          <strong>"How do you rate-limit URL creation?"</strong> — Apply Token Bucket per userId. Free
          users get 10 URLs per day; Pro users get unlimited. The rate limiter is a middleware layer
          before UrlShorteningService.
        </li>
      </ul>

      <h2>FAQ — URL Shortener Low Level Design</h2>

      <h3>What algorithm does bit.ly use to generate short codes?</h3>
      <p>
        The standard approach is a Base62 counter: convert a globally unique integer ID to a 6-character
        Base62 string using digits, lowercase, and uppercase letters. 62^6 = 56 billion unique codes.
        Some systems use MD5 hash (first 7 characters) with collision retry, but counter-based is simpler
        and collision-free.
      </p>

      <h3>What is the difference between a 301 and 302 redirect for URL shorteners?</h3>
      <p>
        301 (Permanent Redirect) is cached by browsers — future requests to the short URL go directly to
        the long URL, bypassing the shortener. 302 (Temporary Redirect) forces the browser to hit the
        shortener every time, allowing click tracking. Most shorteners use 302 for analytics and 301 only
        for permanent aliases.
      </p>

      <h3>How do you handle custom aliases in URL Shortener LLD?</h3>
      <p>
        Check if the alias exists in the DB before saving. If taken, throw a conflict exception and ask
        the user to choose a different alias. Store custom aliases in the same UrlMapping table as
        generated codes — the shortCode column is simply user-provided instead of system-generated.
      </p>

      <h3>How do you expire URLs automatically in URL Shortener?</h3>
      <p>
        Store expiresAt on the UrlMapping. During resolve(), check if expiresAt is in the past —
        if so, return 410 Gone. Set the Redis TTL to match expiresAt so cached entries also expire
        automatically. No background cleanup job is needed for the redirect flow.
      </p>
    </>
  );
}
