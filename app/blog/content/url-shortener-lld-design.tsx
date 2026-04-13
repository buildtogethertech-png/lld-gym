export default function Content() {
  return (
    <>
      <p>The URL Shortener (like bit.ly or TinyURL) is a classic LLD problem that tests your understanding of encoding schemes, collision handling, caching, and analytics. It's commonly asked at Google, Microsoft, Amazon, and startups. Here's a complete design walkthrough.</p>
      <h2>Core Requirements</h2>
      <ul>
        <li>Shorten a long URL to a 6-8 character alias</li>
        <li>Redirect short URL to original URL</li>
        <li>Custom alias support</li>
        <li>URL expiration (TTL)</li>
        <li>Click analytics: total clicks, unique visitors, geographic data</li>
        <li>User accounts to manage URLs</li>
      </ul>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>URL</strong> — original URL, short code, userId, createdAt, expiresAt</li>
        <li><strong>ShortCodeGenerator</strong> — produces unique 6-char codes</li>
        <li><strong>ClickEvent</strong> — timestamp, IP, userAgent, referrer</li>
        <li><strong>Analytics</strong> — aggregated click stats per URL</li>
        <li><strong>User</strong> — owns URLs, has quota limits</li>
      </ul>
      <h2>Short Code Generation</h2>
      <pre>{`class Base62Generator implements CodeGenerationStrategy {
  private chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  generate(url: string): string {
    // MD5 hash → take first 8 chars → Base62 encode
    const hash = md5(url).substring(0, 8);
    return this.toBase62(parseInt(hash, 16));
  }

  private toBase62(num: number): string {
    let result = "";
    while (num > 0) {
      result = this.chars[num % 62] + result;
      num = Math.floor(num / 62);
    }
    return result.padStart(6, "0");
  }
}`}</pre>
      <h2>Collision Handling</h2>
      <p>Two different URLs can hash to the same code. Always check and retry with a salt:</p>
      <pre>{`class URLShortenerService {
  shorten(originalUrl: string, userId: string): string {
    let code = this.generator.generate(originalUrl);
    let attempt = 0;
    while (this.urlRepo.existsByCode(code)) {
      code = this.generator.generate(originalUrl + attempt++);
    }
    this.urlRepo.save({ code, originalUrl, userId });
    return code;
  }
}`}</pre>
      <h2>Analytics with Observer</h2>
      <pre>{`class RedirectService {
  redirect(shortCode: string, context: RequestContext): string {
    const url = this.urlRepo.findByCode(shortCode);
    if (!url || url.isExpired()) throw new NotFoundException();
    // Fire analytics event asynchronously
    this.eventBus.publish(new ClickEvent(shortCode, context));
    return url.originalUrl;
  }
}

class AnalyticsService implements EventHandler<ClickEvent> {
  handle(event: ClickEvent) {
    this.analyticsRepo.incrementClicks(event.shortCode);
    this.analyticsRepo.recordVisitor(event.shortCode, event.ip);
  }
}`}</pre>
      <h2>Common Questions</h2>
      <ul>
        <li>"How do you handle expired URLs?" → Check expiry on redirect, return 410 Gone</li>
        <li>"How do you make redirects fast?" → Cache hot URLs in Redis with TTL</li>
        <li>"Same URL for same user?" → Hash (userId + originalUrl) to generate code</li>
        <li>"Custom aliases?" → Let user provide code, check availability first</li>
      </ul>
    </>
  );
}
