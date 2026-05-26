export default function Content() {
  return (
    <>
      <p>
        Chat Application (WhatsApp / Slack) Low Level Design is an advanced LLD problem that covers the
        Observer pattern for real-time delivery, composite entities for group vs 1-on-1 chats, and
        message status state machines. It is frequently asked at Slack, Meta, Zomato, and Meesho for
        senior SDE roles. This guide covers the complete Chat LLD with Java code, class diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Chat Application LLD</h2>
      <p>
        The chat problem tests real-time system thinking inside an OOD interview. Interviewers want to see:
      </p>
      <ul>
        <li>Do you use the Observer or Pub/Sub pattern for real-time message delivery?</li>
        <li>Can you model 1-on-1 and group chats without duplicating logic (Composite pattern)?</li>
        <li>Can you design message status: SENT → DELIVERED → READ?</li>
        <li>Do you handle offline users — message queuing and delivery on reconnect?</li>
        <li>Can you design Message with proper metadata — id, sender, timestamp, status, content type?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Users can send and receive text, image, and file messages</li>
        <li>Support 1-on-1 direct messages and group chats (up to 256 members)</li>
        <li>Message delivery status: SENT (server received), DELIVERED (recipient device), READ</li>
        <li>Users can create groups, add/remove members, and set group names</li>
        <li>Messages are persisted — users can scroll back through history</li>
        <li>Users see online/last-seen status of their contacts</li>
        <li>Offline users receive messages when they reconnect</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Message delivery latency under 500ms for online users</li>
        <li>Messages must not be lost — at-least-once delivery with deduplication</li>
        <li>A single message to a 256-member group must fan out to all online members</li>
        <li>Message history must be retrievable with pagination (cursor-based)</li>
      </ul>

      <h2>Core Entities — Chat Application LLD Class Design</h2>
      <ul>
        <li><strong>User</strong> — id, name, phone, status (ONLINE/OFFLINE), lastSeen</li>
        <li><strong>Chat</strong> — abstract; DirectChat and GroupChat extend it</li>
        <li><strong>DirectChat</strong> — two participants, no name</li>
        <li><strong>GroupChat</strong> — name, admin, list of members</li>
        <li><strong>Message</strong> — id, chatId, senderId, content, contentType, timestamp, status</li>
        <li><strong>MessageStatus</strong> — messageId, userId, status (SENT/DELIVERED/READ)</li>
        <li><strong>ChatService</strong> — send message, create chat, add member</li>
        <li><strong>NotificationService</strong> — delivers messages to online users (Observer)</li>
        <li><strong>MessageQueue</strong> — holds messages for offline users</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`User
+-- id, name, phone
+-- status: UserStatus (ONLINE/OFFLINE)
+-- lastSeen: LocalDateTime

Chat (abstract)
+-- id: String
+-- messages: List<Message>
+-- getParticipants(): List<User>
+-- sendMessage(message): void

DirectChat extends Chat
+-- user1: User, user2: User

GroupChat extends Chat
+-- name: String, admin: User
+-- members: List<User>
+-- addMember(user), removeMember(user)

Message
+-- id, chatId, senderId: String
+-- content: String
+-- contentType: ContentType (TEXT/IMAGE/FILE)
+-- timestamp: LocalDateTime
+-- status: MessageStatus (SENT/DELIVERED/READ)

MessageStatusRecord
+-- messageId, userId: String
+-- status: MessageStatus

ChatService
+-- sendMessage(chatId, senderId, content): Message
+-- createGroup(name, adminId, memberIds): GroupChat
+-- addMember(groupId, userId): void

NotificationService (Observer)
+-- subscribe(userId, websocket)
+-- notify(userId, message): void`}</pre>

      <h2>Observer Pattern — Real-Time Message Delivery</h2>
      <pre>{`public interface MessageObserver {
    void onMessage(Message message);
}

// WebSocketHandler implements this for each connected client
public class WebSocketHandler implements MessageObserver {
    private final WebSocketSession session;
    private final String userId;

    @Override
    public void onMessage(Message message) {
        if (session.isOpen()) {
            session.sendText(serialize(message));
        }
    }
}

public class NotificationService {
    // userId -> list of their active connections (one per device)
    private final ConcurrentHashMap<String, List<MessageObserver>> subscribers = new ConcurrentHashMap<>();

    public void subscribe(String userId, MessageObserver observer) {
        subscribers.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(observer);
    }

    public void unsubscribe(String userId, MessageObserver observer) {
        subscribers.getOrDefault(userId, List.of()).remove(observer);
    }

    public boolean isOnline(String userId) {
        List<MessageObserver> obs = subscribers.get(userId);
        return obs != null && !obs.isEmpty();
    }

    public void deliver(String userId, Message message) {
        List<MessageObserver> obs = subscribers.getOrDefault(userId, List.of());
        for (MessageObserver observer : obs) {
            observer.onMessage(message);
        }
    }
}`}</pre>

      <h2>ChatService — Sending Messages with Fan-Out</h2>
      <pre>{`public class ChatService {
    private final ChatRepository chatRepo;
    private final MessageRepository messageRepo;
    private final NotificationService notificationService;
    private final MessageQueueService queueService; // for offline users
    private final StatusService statusService;

    public Message sendMessage(String chatId, String senderId, String content, ContentType type) {
        Chat chat = chatRepo.findById(chatId);
        Message message = new Message(
            UUID.randomUUID().toString(), chatId, senderId,
            content, type, LocalDateTime.now(), MessageStatus.SENT
        );
        messageRepo.save(message);

        // Fan-out to all participants
        for (User participant : chat.getParticipants()) {
            if (participant.getId().equals(senderId)) continue;

            if (notificationService.isOnline(participant.getId())) {
                notificationService.deliver(participant.getId(), message);
                statusService.updateStatus(message.getId(), participant.getId(), MessageStatus.DELIVERED);
            } else {
                // Queue for when user reconnects
                queueService.enqueue(participant.getId(), message);
            }
        }
        return message;
    }

    public void onUserConnect(String userId) {
        // Drain queued messages on reconnect
        List<Message> pending = queueService.drain(userId);
        for (Message msg : pending) {
            notificationService.deliver(userId, msg);
            statusService.updateStatus(msg.getId(), userId, MessageStatus.DELIVERED);
        }
    }

    public void markRead(String messageId, String userId) {
        statusService.updateStatus(messageId, userId, MessageStatus.READ);
        // Notify sender of read receipt
        Message msg = messageRepo.findById(messageId);
        notificationService.deliver(msg.getSenderId(),
            ReadReceipt.of(messageId, userId, LocalDateTime.now()));
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Composite pattern for DirectChat and GroupChat:</strong> Both share the same Chat
          interface (getParticipants, sendMessage). ChatService only works with Chat — it does not care
          whether it is direct or group. Adding a ChannelChat (Slack-style) is a new subclass only.
        </li>
        <li>
          <strong>Per-user message queue for offline delivery:</strong> Rather than polling the DB for
          undelivered messages on reconnect, a lightweight queue (Redis list or in-memory) holds
          messages for offline users. On connect, drain and deliver atomically.
        </li>
        <li>
          <strong>Separate MessageStatusRecord from Message:</strong> In a group chat with 256 members,
          each message has 256 individual statuses. Storing status per user in a separate table keeps
          the Message entity lightweight and status updates cheap (single row update).
        </li>
        <li>
          <strong>CopyOnWriteArrayList for subscribers:</strong> WebSocket disconnects can remove
          observers while message delivery is iterating the list. CopyOnWriteArrayList allows concurrent
          reads with safe writes — no ConcurrentModificationException.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you scale fan-out for a 256-member group?"</strong> — Use an async thread pool
          or message broker (Kafka). Publish the message once to a group topic. Each user's connection
          server subscribes to that topic and delivers to its local WebSocket connections.
        </li>
        <li>
          <strong>"How do you prevent duplicate messages on retries?"</strong> — Assign a client-generated
          idempotency key to each send request. The server deduplicates on this key before persisting.
          The client retries with the same key if it does not receive an ACK within 3 seconds.
        </li>
        <li>
          <strong>"How do you handle message encryption?"</strong> — Add a contentKey field to Message.
          End-to-end encryption: the sender encrypts the content with the recipient's public key; the
          server stores ciphertext only. The server cannot read message content.
        </li>
      </ul>

      <h2>FAQ — Chat Application Low Level Design</h2>

      <h3>What design patterns are used in WhatsApp LLD?</h3>
      <p>
        The primary patterns are <strong>Observer</strong> (real-time message delivery via WebSocket),
        <strong>Composite</strong> (DirectChat and GroupChat share Chat interface), and
        <strong>State Machine</strong> (message status: SENT → DELIVERED → READ). The Repository
        pattern manages message persistence.
      </p>

      <h3>How do you model group chat vs 1-on-1 chat?</h3>
      <p>
        Use an abstract Chat class with a getParticipants() method. DirectChat holds exactly two User
        references. GroupChat holds a dynamic list of members plus admin metadata. ChatService treats
        both identically — it calls chat.getParticipants() to get the fan-out list.
      </p>

      <h3>How does message delivery status work?</h3>
      <p>
        SENT: server received the message from the sender. DELIVERED: server pushed it to at least one of
        the recipient's devices. READ: the recipient opened and viewed the message. Each state triggers a
        notification back to the sender (the tick system in WhatsApp). In group chats, DELIVERED and READ
        are tracked per member in MessageStatusRecord.
      </p>

      <h3>How do you handle offline users in a chat system?</h3>
      <p>
        When notificationService.isOnline() returns false, enqueue the message in a per-user queue (Redis
        list with userId as key). When the user reconnects, drain the queue and deliver all pending
        messages in order. Mark each as DELIVERED after sending. Ensure the queue is bounded to prevent
        unbounded growth for long-offline users.
      </p>
    </>
  );
}
