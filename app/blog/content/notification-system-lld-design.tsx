export default function Content() {
  return (
    <>
      <p>
        Notification System Low Level Design is a core infrastructure problem asked at Razorpay, PhonePe,
        Swiggy, and Meesho. It requires multi-channel delivery (Email, SMS, Push, In-App), user preference
        management, rate limiting, and retry with backoff. This guide covers the complete Notification System
        LLD with Java code, class diagram, and interview FAQ.
      </p>

      <h2>Why Interviewers Ask Notification System LLD</h2>
      <p>
        Almost every product requires notifications. Interviewers use this problem to test:
      </p>
      <ul>
        <li>Do you use Template Method or Strategy for per-channel formatting?</li>
        <li>Can you design user preference management — opt-in/opt-out per channel and category?</li>
        <li>Do you implement retry with exponential backoff for failed deliveries?</li>
        <li>Can you rate-limit per user per channel (e.g., max 5 SMS/day)?</li>
        <li>Do you separate notification creation from delivery (event-driven architecture)?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Send notifications via Email, SMS, Push (FCM/APNs), and In-App channels</li>
        <li>Users can set preferences — opt out of specific channels or notification categories</li>
        <li>Support notification categories: TRANSACTION, MARKETING, ALERT, REMINDER</li>
        <li>Failed deliveries must be retried with exponential backoff (max 3 attempts)</li>
        <li>Rate limit notifications per user: max 5 SMS per day, 50 push per day</li>
        <li>Track delivery status: PENDING, SENT, DELIVERED, FAILED</li>
        <li>Support templated messages — Hello {'{name}'}, your order {'{orderId}'} is ready</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Notification send must not block the calling service (fire-and-forget)</li>
        <li>System must handle 1 million notifications per hour</li>
        <li>Adding a new channel (e.g., WhatsApp) must not change existing channels</li>
        <li>Template rendering must be injected — no hardcoded strings in service code</li>
      </ul>

      <h2>Core Entities — Notification System LLD Class Design</h2>
      <ul>
        <li><strong>Notification</strong> — id, userId, category, templateId, params, channels, status</li>
        <li><strong>NotificationChannel</strong> — interface; EmailChannel, SMSChannel, PushChannel, InAppChannel</li>
        <li><strong>UserPreference</strong> — userId, channel, category, isEnabled</li>
        <li><strong>NotificationTemplate</strong> — id, channel, category, subjectTemplate, bodyTemplate</li>
        <li><strong>DeliveryRecord</strong> — notificationId, channel, attempt, status, timestamp, error</li>
        <li><strong>NotificationService</strong> — entry point; applies preferences, routes to channels</li>
        <li><strong>RetryScheduler</strong> — exponential backoff retry for FAILED deliveries</li>
        <li><strong>RateLimiter</strong> — per-user per-channel rate limiting</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Notification
+-- id, userId: String
+-- category: NotificationCategory
+-- templateId: String
+-- params: Map<String, String>
+-- channels: List<ChannelType>
+-- status: NotificationStatus (PENDING/PARTIAL/SENT/FAILED)

NotificationChannel (interface)
+-- send(notification, renderedContent): DeliveryResult
+-- getChannelType(): ChannelType

EmailChannel    implements NotificationChannel
SMSChannel      implements NotificationChannel
PushChannel     implements NotificationChannel
InAppChannel    implements NotificationChannel

UserPreference
+-- userId, channel: ChannelType
+-- category: NotificationCategory
+-- isEnabled: boolean

NotificationTemplate
+-- id, channelType, category: String
+-- subjectTemplate, bodyTemplate: String

DeliveryRecord
+-- notificationId: String
+-- channel: ChannelType
+-- attempt: int
+-- status: DeliveryStatus
+-- sentAt, failedAt: LocalDateTime
+-- errorMessage: String`}</pre>

      <h2>NotificationChannel — Strategy Pattern</h2>
      <pre>{`public interface NotificationChannel {
    DeliveryResult send(String userId, RenderedContent content);
    ChannelType getChannelType();
}

public class EmailChannel implements NotificationChannel {
    private final EmailGateway emailGateway;

    @Override
    public DeliveryResult send(String userId, RenderedContent content) {
        String email = userRepo.getEmail(userId);
        try {
            emailGateway.send(email, content.getSubject(), content.getBody());
            return DeliveryResult.success(ChannelType.EMAIL);
        } catch (EmailException e) {
            return DeliveryResult.failure(ChannelType.EMAIL, e.getMessage());
        }
    }

    @Override
    public ChannelType getChannelType() { return ChannelType.EMAIL; }
}

public class SMSChannel implements NotificationChannel {
    private final SmsGateway smsGateway;

    @Override
    public DeliveryResult send(String userId, RenderedContent content) {
        String phone = userRepo.getPhone(userId);
        try {
            smsGateway.send(phone, content.getBody()); // SMS has no subject
            return DeliveryResult.success(ChannelType.SMS);
        } catch (SmsException e) {
            return DeliveryResult.failure(ChannelType.SMS, e.getMessage());
        }
    }

    @Override
    public ChannelType getChannelType() { return ChannelType.SMS; }
}`}</pre>

      <h2>NotificationService — Preference Filtering and Routing</h2>
      <pre>{`public class NotificationService {
    private final Map<ChannelType, NotificationChannel> channels;
    private final PreferenceService preferenceService;
    private final TemplateEngine templateEngine;
    private final RateLimiter rateLimiter;
    private final DeliveryRecordRepository deliveryRepo;

    public void send(Notification notification) {
        for (ChannelType channelType : notification.getChannels()) {
            // Check user preference
            if (!preferenceService.isEnabled(notification.getUserId(), channelType, notification.getCategory())) {
                continue;
            }
            // Check rate limit
            if (!rateLimiter.tryAcquire(notification.getUserId(), channelType)) {
                log("Rate limit exceeded for user " + notification.getUserId() + " on " + channelType);
                continue;
            }

            NotificationTemplate template = templateEngine.getTemplate(channelType, notification.getCategory());
            RenderedContent content = templateEngine.render(template, notification.getParams());

            NotificationChannel channel = channels.get(channelType);
            DeliveryResult result = channel.send(notification.getUserId(), content);

            DeliveryRecord record = new DeliveryRecord(notification.getId(), channelType,
                1, result.getStatus(), LocalDateTime.now(), result.getError());
            deliveryRepo.save(record);

            if (result.getStatus() == DeliveryStatus.FAILED) {
                retryScheduler.schedule(notification, channelType, 1);
            }
        }
    }
}`}</pre>

      <h2>Retry with Exponential Backoff</h2>
      <pre>{`public class RetryScheduler {
    private static final int MAX_ATTEMPTS = 3;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);
    private final NotificationService notificationService;

    public void schedule(Notification notification, ChannelType channel, int attempt) {
        if (attempt >= MAX_ATTEMPTS) {
            markPermanentlyFailed(notification, channel);
            return;
        }
        long delaySeconds = (long) Math.pow(2, attempt) * 30; // 30s, 60s, 120s
        scheduler.schedule(() -> retry(notification, channel, attempt + 1),
            delaySeconds, TimeUnit.SECONDS);
    }

    private void retry(Notification notification, ChannelType channel, int attempt) {
        NotificationChannel ch = channelMap.get(channel);
        RenderedContent content = templateEngine.render(notification);
        DeliveryResult result = ch.send(notification.getUserId(), content);

        DeliveryRecord record = new DeliveryRecord(notification.getId(), channel,
            attempt, result.getStatus(), LocalDateTime.now(), result.getError());
        deliveryRepo.save(record);

        if (result.getStatus() == DeliveryStatus.FAILED) {
            schedule(notification, channel, attempt);
        }
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Strategy per channel instead of if-else:</strong> Each channel is a separate class. 
          Adding WhatsApp is a new WhatsAppChannel class with no changes to NotificationService. The channel
          map is populated at startup via dependency injection.
        </li>
        <li>
          <strong>Preference checked before rate limiting:</strong> If a user opted out, skip rate limit
          consumption. Rate limit is a shared resource — don not waste tokens on messages the user will
          never receive.
        </li>
        <li>
          <strong>ScheduledExecutorService for retry:</strong> Retries are scheduled non-blocking. The
          main send() returns immediately. Retries happen in the background with exponential backoff
          (30s, 60s, 120s). In production, use a durable job queue (SQS, Kafka) instead of in-process.
        </li>
        <li>
          <strong>Template engine separation:</strong> TemplateEngine is injected into NotificationService.
          Message templates live in a database or config store, not in Java strings. This lets marketing
          teams update copy without code deployments.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you handle notification batching?"</strong> — Collect notifications for the same
          user within a 5-minute window and send as a single digest email. Use a scheduled job that queries
          PENDING notifications grouped by userId and bundles them.
        </li>
        <li>
          <strong>"How do you prioritize ALERT notifications over MARKETING?"</strong> — Use two queues:
          HIGH_PRIORITY (ALERT, TRANSACTION) and LOW_PRIORITY (MARKETING, REMINDER). Workers on the high
          priority queue run at 4x the thread count of low priority.
        </li>
        <li>
          <strong>"How do you track delivery status to the user's device?"</strong> — Push channels get
          delivery receipts via FCM/APNs callbacks. Register a webhook that updates DeliveryRecord status
          from SENT to DELIVERED when the device ACKs.
        </li>
      </ul>

      <h2>FAQ — Notification System Low Level Design</h2>

      <h3>What design patterns are used in Notification System LLD?</h3>
      <p>
        The primary patterns are <strong>Strategy</strong> (NotificationChannel per delivery channel),
        <strong>Template Method</strong> (base notification flow with per-channel overrides), and
        <strong>Observer</strong> (channels subscribe to delivery status callbacks). The
        <strong>Chain of Responsibility</strong> can optionally model the preference → rate-limit → send pipeline.
      </p>

      <h3>How do you implement user notification preferences?</h3>
      <p>
        Store a UserPreference record per (userId, channelType, category) combination with an isEnabled
        flag. Before routing to a channel, query preferences. For performance, cache preferences in Redis
        with a short TTL (5 minutes) — preference changes propagate within one cache cycle.
      </p>

      <h3>How do you rate-limit notifications per user?</h3>
      <p>
        Use a Token Bucket per (userId, channelType) pair. SMS: 5 tokens/day, Push: 50 tokens/day.
        Store bucket state in Redis with a daily expiry key. On each send attempt, call tryAcquire —
        if it returns false, skip the channel without consuming a retry attempt.
      </p>

      <h3>How do you handle notification templates?</h3>
      <p>
        Store templates in a database: templateId, channelType, category, subjectTemplate, bodyTemplate.
        Use a simple variable replacement engine (Mustache or custom) to inject params like
        name and orderId at send time. This keeps templates editable without code changes.
      </p>
    </>
  );
}
