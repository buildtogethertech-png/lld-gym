export default function Content() {
  return (
    <>
      <p>A Notification System that handles multiple channels (Email, SMS, Push, In-App) with rate limiting, retry, and user preferences is a frequent LLD problem at Razorpay, PhonePe, Freshworks, and other product companies. Let's design it end-to-end.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Notification</strong> — type, title, body, priority, recipient</li>
        <li><strong>Channel</strong> — Email, SMS, Push, InApp</li>
        <li><strong>UserPreference</strong> — which channels enabled per notification type</li>
        <li><strong>NotificationService</strong> — routes notifications to appropriate channels</li>
        <li><strong>RateLimiter</strong> — prevents channel flooding</li>
        <li><strong>RetryQueue</strong> — retries failed deliveries</li>
      </ul>
      <h2>Strategy Pattern for Channels</h2>
      <pre>{`interface NotificationChannel {
  send(notification: Notification, user: User): boolean;
  supports(type: NotificationType): boolean;
}

class EmailChannel implements NotificationChannel {
  send(n: Notification, user: User): boolean {
    if (!user.email) return false;
    return this.emailClient.send(user.email, n.title, n.body);
  }
}
class SMSChannel   implements NotificationChannel { ... }
class PushChannel  implements NotificationChannel { ... }
class InAppChannel implements NotificationChannel { ... }`}</pre>
      <h2>Routing by User Preference</h2>
      <pre>{`class NotificationService {
  send(notification: Notification, userId: string): void {
    const prefs = this.prefRepo.get(userId, notification.type);
    const channels = this.channels.filter(c =>
      prefs.enabledChannels.includes(c.name) && c.supports(notification.type)
    );

    for (const channel of channels) {
      if (!this.rateLimiter.allow(userId, channel.name)) {
        if (notification.priority === Priority.CRITICAL) {
          this.bypassAndSend(channel, notification, userId); // Critical bypasses limits
        }
        continue;
      }
      const success = channel.send(notification, this.userRepo.get(userId));
      if (!success) this.retryQueue.enqueue(notification, channel, userId);
    }
  }
}`}</pre>
      <h2>Rate Limiter</h2>
      <pre>{`class RateLimiter {
  // Sliding window per user per channel
  allow(userId: string, channel: string): boolean {
    const key = \`\${userId}:\${channel}\`;
    const count = this.countInLastHour(key);
    const limit = this.getLimitForChannel(channel); // Email: 100/hr, SMS: 10/hr
    return count < limit;
  }
}`}</pre>
      <h2>Retry with Exponential Backoff</h2>
      <pre>{`class RetryQueue {
  enqueue(notification: Notification, channel: NotificationChannel, userId: string) {
    const job = { notification, channel, userId, attempts: 0 };
    this.schedule(job, 1000); // First retry in 1 second
  }
  private retry(job: RetryJob) {
    if (job.attempts >= 3) { this.dlq.add(job); return; }
    const success = job.channel.send(job.notification, this.userRepo.get(job.userId));
    if (!success) {
      job.attempts++;
      this.schedule(job, Math.pow(2, job.attempts) * 1000); // Exponential backoff
    }
  }
}`}</pre>
    </>
  );
}
