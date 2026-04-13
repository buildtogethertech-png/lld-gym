export default function Content() {
  return (
    <>
      <p>Designing a chat application like WhatsApp is a popular LLD problem that tests your ability to model real-time messaging, group management, message delivery status, and media handling. It's frequently asked at Slack, Meta, Zomato, and Swiggy.</p>
      <h2>Core Requirements</h2>
      <ul>
        <li>One-on-one messaging</li>
        <li>Group chats with member management</li>
        <li>Message status: Sent → Delivered → Read</li>
        <li>Online/offline user status</li>
        <li>Send text, images, documents</li>
        <li>Message history and search</li>
      </ul>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>User</strong> — profile, online status, last seen</li>
        <li><strong>Chat</strong> — abstract; either DirectChat or GroupChat (Composite pattern)</li>
        <li><strong>Message</strong> — content, sender, timestamp, status, type (Text/Image/Document)</li>
        <li><strong>MessageStatus</strong> — SENT, DELIVERED, READ per recipient</li>
        <li><strong>GroupMembership</strong> — user, group, role (Admin/Member), joinedAt</li>
      </ul>
      <h2>Composite Pattern for Chat Types</h2>
      <pre>{`interface Chat {
  getId(): string;
  sendMessage(msg: Message): void;
  getMessages(limit: number): Message[];
  getParticipants(): User[];
}

class DirectChat implements Chat {
  participants: [User, User];
  sendMessage(msg: Message) {
    this.messageStore.save(this.id, msg);
    this.notifyParticipants(msg);
  }
}

class GroupChat implements Chat {
  name: string;
  members: GroupMembership[];
  maxMembers = 256;

  addMember(user: User, addedBy: User): void {
    if (this.members.length >= this.maxMembers) throw new Error("Group full");
    const adder = this.getMembership(addedBy);
    if (!adder?.isAdmin()) throw new Error("Only admins can add members");
    this.members.push(new GroupMembership(user, this));
  }
}`}</pre>
      <h2>Message Delivery Status</h2>
      <pre>{`class Message {
  id: string;
  content: string;
  sender: User;
  type: MessageType;  // TEXT | IMAGE | DOCUMENT
  sentAt: Date;
  statusPerRecipient: Map<string, MessageStatus>;

  markDelivered(userId: string) {
    this.statusPerRecipient.set(userId, MessageStatus.DELIVERED);
    if (this.allDelivered()) this.overallStatus = MessageStatus.DELIVERED;
  }

  markRead(userId: string) {
    this.statusPerRecipient.set(userId, MessageStatus.READ);
    if (this.allRead()) this.overallStatus = MessageStatus.READ;
  }
}`}</pre>
      <h2>Observer for Real-time Delivery</h2>
      <pre>{`class MessageBroker {
  private subscribers = new Map<string, MessageHandler[]>();

  subscribe(userId: string, handler: MessageHandler) {
    this.subscribers.get(userId)?.push(handler) ??
      this.subscribers.set(userId, [handler]);
  }

  deliver(message: Message, recipients: User[]) {
    recipients.forEach(user => {
      const handlers = this.subscribers.get(user.id) ?? [];
      if (handlers.length > 0) {
        handlers.forEach(h => h.handle(message));
        message.markDelivered(user.id);
      }
      // User offline: queue for when they come online
    });
  }
}`}</pre>
      <h2>Common Questions</h2>
      <ul>
        <li>"How do messages reach offline users?" → Store in a message queue (per-user inbox); deliver on reconnect</li>
        <li>"How does read receipt work in groups?" → MessageStatus tracks per-recipient; "Read" shows when ALL have read</li>
        <li>"How to support 256-member groups?" → GroupChat stores membership list, fan-out on send</li>
        <li>"How to search messages?" → Full-text index on message content, scoped to chat ID</li>
      </ul>
    </>
  );
}
