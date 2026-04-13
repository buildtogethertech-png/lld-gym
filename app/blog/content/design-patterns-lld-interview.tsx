export default function Content() {
  return (
    <>
      <p>Design patterns appear in almost every LLD interview question. Knowing when and how to apply them is what separates candidates who pass from those who don't. This guide covers the 10 most important patterns with real LLD examples from problems asked at Amazon, Flipkart, Uber, and other top companies.</p>

      <h2>1. Strategy Pattern</h2>
      <p><strong>Use when:</strong> Multiple algorithms or behaviors for the same operation, and you want to swap them at runtime.</p>
      <p><strong>LLD examples:</strong> Fare calculation in Uber, payment methods in e-commerce, split types in Splitwise, pricing in Parking Lot.</p>
      <pre>{`interface FareStrategy { calculate(km: number, min: number): number; }
class EconomyFare implements FareStrategy { ... }
class PremiumFare implements FareStrategy { ... }

// Usage — switch strategy without changing Trip
class Trip { constructor(private fare: FareStrategy) {} }`}</pre>
      <p><strong>Interview signal:</strong> When you see "support multiple X types" or "configurable behavior" — reach for Strategy.</p>

      <h2>2. Observer Pattern</h2>
      <p><strong>Use when:</strong> One object's state change should notify multiple other objects.</p>
      <p><strong>LLD examples:</strong> Order status updates in food delivery, trip status in Uber, notification system, social media feed.</p>
      <pre>{`interface Observer { update(event: Event): void; }
class Trip {
  private observers: Observer[] = [];
  notify(event: Event) { this.observers.forEach(o => o.update(event)); }
}
class RiderApp implements Observer { update(e) { showNotification(e); } }
class DriverApp implements Observer { update(e) { refreshUI(e); } }`}</pre>

      <h2>3. Factory / Factory Method Pattern</h2>
      <p><strong>Use when:</strong> Object creation logic is complex or varies based on conditions.</p>
      <p><strong>LLD examples:</strong> Creating different notification types, vehicle creation in Parking Lot, order creation in food delivery.</p>
      <pre>{`class NotificationFactory {
  static create(type: "email" | "sms" | "push"): Notification {
    switch(type) {
      case "email": return new EmailNotification();
      case "sms":   return new SMSNotification();
      case "push":  return new PushNotification();
    }
  }
}`}</pre>

      <h2>4. State Pattern</h2>
      <p><strong>Use when:</strong> An object's behavior changes dramatically based on its internal state.</p>
      <p><strong>LLD examples:</strong> Driver states in Uber (Available/OnTrip/Offline), ATM states, elevator states, booking states in BookMyShow.</p>
      <pre>{`interface DriverState {
  acceptTrip(driver: Driver): void;
  goOffline(driver: Driver): void;
}
class AvailableState implements DriverState {
  acceptTrip(driver: Driver) { driver.setState(new OnTripState()); }
  goOffline(driver: Driver)  { driver.setState(new OfflineState()); }
}
class OnTripState implements DriverState {
  acceptTrip() { throw new Error("Already on trip"); }
  goOffline()  { throw new Error("Complete trip first"); }
}`}</pre>

      <h2>5. Command Pattern</h2>
      <p><strong>Use when:</strong> You need to encapsulate operations as objects for queuing, logging, or undo.</p>
      <p><strong>LLD examples:</strong> Job scheduler (each job is a Command), elevator floor requests, inventory operations.</p>
      <pre>{`interface Command { execute(): void; }
class ReserveStockCommand implements Command {
  constructor(private inventory: Inventory, private productId: string, private qty: number) {}
  execute() { this.inventory.reserve(this.productId, this.qty); }
}
// Queue of commands can be replayed, logged, or undone`}</pre>

      <h2>6. Decorator Pattern</h2>
      <p><strong>Use when:</strong> You want to add behavior to an object dynamically without subclassing.</p>
      <p><strong>LLD examples:</strong> Surge pricing on base fare, adding TTL to cache, layered logging handlers.</p>
      <pre>{`class SurgePricingDecorator implements FareStrategy {
  constructor(private base: FareStrategy, private multiplier: number) {}
  calculate(km: number, min: number): number {
    return this.base.calculate(km, min) * this.multiplier;
  }
}`}</pre>

      <h2>7. Singleton Pattern</h2>
      <p><strong>Use when:</strong> Exactly one instance should exist globally.</p>
      <p><strong>LLD examples:</strong> Logger, Config, Connection pool, Cache.</p>
      <pre>{`class Logger {
  private static instance: Logger;
  private constructor() {}
  static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }
}`}</pre>
      <p><strong>Interview warning:</strong> Don't overuse Singleton. Only use it when exactly one instance is genuinely required. Interviewers penalize excessive Singleton usage.</p>

      <h2>8. Template Method Pattern</h2>
      <p><strong>Use when:</strong> An algorithm has a fixed skeleton but some steps vary by subclass.</p>
      <p><strong>LLD examples:</strong> Cancellation policy in Hotel booking, report generation, data export formats.</p>
      <pre>{`abstract class BookingCancellation {
  cancel(booking: Booking): void {
    this.validateCancellation(booking);       // Fixed step
    const refund = this.calculateRefund(booking); // Varies by type
    this.processRefund(booking, refund);      // Fixed step
  }
  abstract calculateRefund(booking: Booking): number;
}`}</pre>

      <h2>9. Chain of Responsibility</h2>
      <p><strong>Use when:</strong> A request passes through a series of handlers, each deciding to process or pass it on.</p>
      <p><strong>LLD examples:</strong> ATM cash dispensing (₹500 → ₹200 → ₹100 notes), fraud detection pipeline, logging handlers, middleware.</p>
      <pre>{`abstract class CashHandler {
  protected next: CashHandler | null = null;
  setNext(h: CashHandler): CashHandler { this.next = h; return h; }
  abstract dispense(amount: number): void;
}
class FiveHundredHandler extends CashHandler {
  dispense(amount: number) {
    const count = Math.floor(amount / 500);
    if (count > 0) { console.log(\`Dispensing \${count} × ₹500\`); }
    this.next?.dispense(amount % 500);
  }
}`}</pre>

      <h2>10. Composite Pattern</h2>
      <p><strong>Use when:</strong> You need to treat individual objects and groups of objects uniformly.</p>
      <p><strong>LLD examples:</strong> Chat (1-on-1 and Group Chat share the same interface), file system (File and Folder), UI components.</p>
      <pre>{`interface Chat {
  sendMessage(msg: Message): void;
  getParticipants(): User[];
}
class DirectChat implements Chat { ... }   // 1-on-1
class GroupChat  implements Chat { ... }   // N participants
// TripService.notifyChat(chat: Chat) works for both ✓`}</pre>

      <h2>Pattern Selection Cheatsheet</h2>
      <ul>
        <li>Multiple behaviors for one operation → <strong>Strategy</strong></li>
        <li>React to state changes across objects → <strong>Observer</strong></li>
        <li>Complex object states → <strong>State</strong></li>
        <li>Create objects without specifying exact class → <strong>Factory</strong></li>
        <li>Add behavior dynamically → <strong>Decorator</strong></li>
        <li>Encapsulate operations as objects → <strong>Command</strong></li>
        <li>Pass requests through handlers → <strong>Chain of Responsibility</strong></li>
        <li>Fixed algorithm, varying steps → <strong>Template Method</strong></li>
        <li>One instance globally → <strong>Singleton</strong></li>
        <li>Treat individual and group uniformly → <strong>Composite</strong></li>
      </ul>
    </>
  );
}
