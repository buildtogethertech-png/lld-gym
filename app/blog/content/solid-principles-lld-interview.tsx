export default function Content() {
  return (
    <>
      <p>SOLID principles are the foundation of good Low Level Design. In interviews at Amazon, Flipkart, Google, and other top companies, interviewers expect you to not just know these principles by name but to apply them naturally in your class design. This guide explains each principle with concrete LLD examples.</p>

      <h2>Why SOLID Matters in LLD Interviews</h2>
      <p>Most candidates can recite the SOLID acronym. Few can apply it. Interviewers test SOLID indirectly — they ask "how would you add a new feature?" or "what's the problem with this design?" If you understand SOLID, you instantly spot the issues and propose clean solutions.</p>

      <h2>S — Single Responsibility Principle</h2>
      <p><em>"A class should have only one reason to change."</em></p>
      <p><strong>Violation:</strong></p>
      <pre>{`class ParkingLot {
  parkVehicle(v: Vehicle): void { ... }
  calculateFee(ticket: Ticket): number { ... }  // Wrong!
  sendSMSAlert(msg: string): void { ... }        // Wrong!
  generateReport(): string { ... }              // Wrong!
}`}</pre>
      <p><strong>Fix:</strong> Each responsibility gets its own class — ParkingLot, FeeCalculator, NotificationService, ReportGenerator.</p>
      <p><strong>Interview tip:</strong> When you see a class doing multiple unrelated things, mention SRP and split it. This is the most commonly violated principle and easiest to spot.</p>

      <h2>O — Open/Closed Principle</h2>
      <p><em>"Open for extension, closed for modification."</em></p>
      <p><strong>Violation:</strong></p>
      <pre>{`class FeeCalculator {
  calculate(vehicle: Vehicle): number {
    if (vehicle.type === "BIKE")  return 20;
    if (vehicle.type === "CAR")   return 40;
    if (vehicle.type === "TRUCK") return 80;
    // Adding electric vehicle requires modifying this class ❌
  }
}`}</pre>
      <p><strong>Fix:</strong> Strategy pattern — each vehicle type implements its own pricing strategy. Adding a new vehicle never touches existing code.</p>
      <pre>{`interface PricingStrategy { calculateFee(duration: number): number; }
class BikePricing  implements PricingStrategy { calculateFee(d) { return 20 * Math.ceil(d/60); } }
class CarPricing   implements PricingStrategy { calculateFee(d) { return 40 * Math.ceil(d/60); } }
// Add ElectricCarPricing without touching anything ✓`}</pre>

      <h2>L — Liskov Substitution Principle</h2>
      <p><em>"Subclasses must be substitutable for their base class."</em></p>
      <p><strong>Violation:</strong></p>
      <pre>{`class Rectangle { setWidth(w) { this.width = w; } setHeight(h) { this.height = h; } }
class Square extends Rectangle {
  setWidth(w) { this.width = w; this.height = w; }  // Breaks Rectangle contract ❌
}`}</pre>
      <p><strong>In LLD interviews:</strong> If your PaymentMethod base class has a processRefund() method but CashPayment can't support refunds, LSP is violated. Either redesign the hierarchy or use a separate RefundablePayment interface.</p>

      <h2>I — Interface Segregation Principle</h2>
      <p><em>"Clients should not be forced to depend on interfaces they don't use."</em></p>
      <p><strong>Violation:</strong></p>
      <pre>{`interface Vehicle {
  getSpeed(): number;
  fly(): void;    // Not all vehicles can fly ❌
  sail(): void;   // Not all vehicles can sail ❌
}
class Car implements Vehicle {
  fly() { throw new Error("Cars can't fly"); }  // Forced to implement ❌
}`}</pre>
      <p><strong>Fix:</strong> Split into Driveable, Flyable, Sailable interfaces. Classes implement only what applies.</p>
      <p><strong>Interview tip:</strong> Watch for fat interfaces. In a Notification system, don't have one giant NotificationService — split into EmailSender, SMSSender, PushSender with a shared Notifier interface.</p>

      <h2>D — Dependency Inversion Principle</h2>
      <p><em>"Depend on abstractions, not concretions."</em></p>
      <p><strong>Violation:</strong></p>
      <pre>{`class OrderService {
  private db = new MySQLDatabase();  // Tightly coupled to MySQL ❌
  saveOrder(order: Order) { this.db.save(order); }
}`}</pre>
      <p><strong>Fix:</strong> Inject the abstraction:</p>
      <pre>{`interface Database { save(entity: any): void; }

class OrderService {
  constructor(private db: Database) {}  // Works with MySQL, MongoDB, in-memory ✓
  saveOrder(order: Order) { this.db.save(order); }
}`}</pre>
      <p><strong>In LLD interviews:</strong> When you use constructor injection for strategies, repositories, and services — you're applying DIP. This is what makes systems testable and swappable.</p>

      <h2>How to Apply SOLID in an Interview</h2>
      <p>You don't need to name-drop "Single Responsibility Principle" every 5 minutes. Instead, let your design speak:</p>
      <ul>
        <li>When splitting classes: "I'm keeping pricing logic separate so changes to fee structure don't affect the parking lot code"</li>
        <li>When using interfaces: "I'm depending on this abstraction so we can swap implementations later"</li>
        <li>When the interviewer asks "how would you add X": "Since we used Strategy here, we just add a new class — nothing else changes"</li>
      </ul>

      <h2>SOLID Quick Reference for LLD Problems</h2>
      <ul>
        <li><strong>Parking Lot</strong>: SRP (split ParkingLot/FeeCalculator), OCP (Strategy for pricing), DIP (inject PricingStrategy)</li>
        <li><strong>Notification System</strong>: ISP (split channel interfaces), OCP (add new channels without modifying core)</li>
        <li><strong>Payment Gateway</strong>: OCP (new payment method = new class), LSP (all PaymentMethod subclasses support charge())</li>
        <li><strong>Chat App</strong>: SRP (split MessageService/UserService/NotificationService), DIP (inject MessageStore)</li>
      </ul>
    </>
  );
}
