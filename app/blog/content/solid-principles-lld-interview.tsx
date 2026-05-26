export default function Content() {
  return (
    <>
      <p>
        SOLID principles are the five foundational guidelines for writing maintainable object-oriented code.
        In LLD interviews at Amazon, Flipkart, Swiggy, and Google, interviewers expect you to not just know
        the acronym but to apply each principle to real system design decisions. This guide explains all five
        principles with concrete LLD examples and how interviewers test them.
      </p>

      <h2>What Are SOLID Principles?</h2>
      <p>
        SOLID is an acronym coined by Robert C. Martin (Uncle Bob):
      </p>
      <ul>
        <li><strong>S</strong> — Single Responsibility Principle (SRP)</li>
        <li><strong>O</strong> — Open/Closed Principle (OCP)</li>
        <li><strong>L</strong> — Liskov Substitution Principle (LSP)</li>
        <li><strong>I</strong> — Interface Segregation Principle (ISP)</li>
        <li><strong>D</strong> — Dependency Inversion Principle (DIP)</li>
      </ul>
      <p>
        These principles guide class design decisions. Violating them makes code fragile, hard to test, and
        resistant to change. In an LLD interview, an interviewer who asks "why did you separate these two
        classes?" is testing whether you know SRP.
      </p>

      <h2>S — Single Responsibility Principle</h2>
      <p>
        A class should have only one reason to change. "Reason to change" means one business actor whose
        requirements can force the class to be modified.
      </p>
      <h3>LLD Example: Parking Lot</h3>
      <pre>{`// VIOLATION: ParkingLot does pricing, persistence, and slot management
public class ParkingLot {
    public Ticket parkVehicle(Vehicle v) { ... }
    public double calculateFee(Ticket t) { ... }  // pricing responsibility
    public void saveToDatabase(Ticket t) { ... }  // persistence responsibility
}

// CORRECT: Separate responsibilities
public class ParkingLot {
    public Ticket parkVehicle(Vehicle v) { ... }  // slot management only
}
public class PricingService {
    public double calculateFee(Ticket t) { ... }
}
public class TicketRepository {
    public void save(Ticket t) { ... }
}`}</pre>
      <p>
        If the pricing model changes, only PricingService changes. If the database schema changes, only
        TicketRepository changes. ParkingLot is untouched by either.
      </p>

      <h2>O — Open/Closed Principle</h2>
      <p>
        Software entities should be open for extension but closed for modification. Add new behavior by
        adding new code, not by changing existing code.
      </p>
      <h3>LLD Example: Notification System</h3>
      <pre>{`// VIOLATION: Every new channel requires modifying NotificationService
public class NotificationService {
    public void send(String type, String message) {
        if (type.equals("EMAIL")) { emailGateway.send(message); }
        else if (type.equals("SMS")) { smsGateway.send(message); }
        // Adding WhatsApp requires editing this class
    }
}

// CORRECT: Closed for modification, open for extension via Strategy
public interface NotificationChannel {
    void send(String message);
}
public class EmailChannel implements NotificationChannel { ... }
public class SMSChannel  implements NotificationChannel { ... }
public class WhatsAppChannel implements NotificationChannel { ... } // new — no existing code changed

public class NotificationService {
    private final Map<String, NotificationChannel> channels;
    public void send(String type, String message) {
        channels.get(type).send(message); // unchanged when adding new channel
    }
}`}</pre>

      <h2>L — Liskov Substitution Principle</h2>
      <p>
        Subtypes must be substitutable for their base types without altering the correctness of the program.
        If you have code that works with a Vehicle, it must work with any subclass of Vehicle.
      </p>
      <h3>LLD Example: Payment Methods</h3>
      <pre>{`// VIOLATION: CryptocurrencyPayment extends CardPayment but throws on getCvv()
public class CryptocurrencyPayment extends CardPayment {
    @Override
    public String getCvv() {
        throw new UnsupportedOperationException(); // breaks LSP
    }
}

// CORRECT: Model the correct hierarchy
public abstract class Payment {
    public abstract PaymentResult process(double amount);
}
public class CardPayment extends Payment {
    private String cvv;
    @Override
    public PaymentResult process(double amount) { ... }
}
public class CryptocurrencyPayment extends Payment {
    private String walletAddress;
    @Override
    public PaymentResult process(double amount) { ... }
}`}</pre>
      <p>
        LSP violations are often caught by tests — if you need to check instanceof before calling a method,
        the hierarchy is wrong.
      </p>

      <h2>I — Interface Segregation Principle</h2>
      <p>
        Clients should not be forced to depend on interfaces they do not use. Split fat interfaces into
        smaller, role-specific ones.
      </p>
      <h3>LLD Example: Ride Sharing</h3>
      <pre>{`// VIOLATION: Driver forced to implement unrelated methods
public interface RideSharingActor {
    void requestRide(Location from, Location to);   // for passengers only
    void acceptRide(String rideId);                  // for drivers only
    void cancelRide(String rideId);
    void viewEarnings();                             // for drivers only
}

// CORRECT: Separate by role
public interface Passenger {
    void requestRide(Location from, Location to);
    void cancelRide(String rideId);
}
public interface Driver {
    void acceptRide(String rideId);
    void viewEarnings();
    void cancelRide(String rideId);
}

// Driver implements Driver, Passenger implements Passenger
// No class is forced to implement irrelevant methods`}</pre>

      <h2>D — Dependency Inversion Principle</h2>
      <p>
        High-level modules should not depend on low-level modules. Both should depend on abstractions.
        Abstractions should not depend on details; details should depend on abstractions.
      </p>
      <h3>LLD Example: Inventory Management</h3>
      <pre>{`// VIOLATION: InventoryService depends directly on MySQL implementation
public class InventoryService {
    private final MySqlInventoryRepository repo = new MySqlInventoryRepository(); // concrete dependency

    public InventoryItem findById(String id) {
        return repo.findById(id); // cannot swap to MongoDB without changing InventoryService
    }
}

// CORRECT: Depend on abstraction; inject concrete implementation
public interface InventoryRepository {
    InventoryItem findById(String id);
    void save(InventoryItem item);
}

public class InventoryService {
    private final InventoryRepository repo; // depends on abstraction

    public InventoryService(InventoryRepository repo) { // injected — testable
        this.repo = repo;
    }
}

// Production: new InventoryService(new MySqlInventoryRepository())
// Test:       new InventoryService(new InMemoryInventoryRepository())`}</pre>

      <h2>How Interviewers Test SOLID Principles</h2>
      <ul>
        <li>
          <strong>"Why did you create a separate PricingService?"</strong> — Tests SRP. Answer: pricing and
          parking lot management are two separate reasons to change.
        </li>
        <li>
          <strong>"What if I want to add a new split type to Splitwise?"</strong> — Tests OCP. Answer:
          add a new SplitStrategy class; no existing code changes.
        </li>
        <li>
          <strong>"Can I use a CryptoCurrency object wherever I use a Card?"</strong> — Tests LSP. Show
          the correct hierarchy where all payment types share a common interface.
        </li>
        <li>
          <strong>"How would you test the BookingService in isolation?"</strong> — Tests DIP. Answer:
          inject a mock repository via the constructor — possible only because BookingService depends on
          an interface, not a concrete class.
        </li>
      </ul>

      <h2>SOLID Quick Reference</h2>
      <pre>{`Principle | One-Line Summary                     | Key Pattern
--------- | ------------------------------------ | ------------------
SRP       | One class, one reason to change      | Separate services
OCP       | Extend behavior, not modify code     | Strategy, Decorator
LSP       | Subclasses must honor base contracts | Correct inheritance
ISP       | Small, focused interfaces            | Role interfaces
DIP       | Depend on abstractions, not concrets | Constructor injection`}</pre>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"Is it always wrong for a class to have two responsibilities?"</strong> — SRP says one
          reason to change, not one method. A small helper class that both parses and validates a format
          may be fine if both change together for the same reason.
        </li>
        <li>
          <strong>"Does OCP mean I can never modify a class?"</strong> — No. Bug fixes and requirement
          changes that affect the class's own behavior are expected. OCP prevents adding new behavior by
          forking the existing class with a new if-else branch.
        </li>
        <li>
          <strong>"Can SOLID principles conflict?"</strong> — Yes. Strict ISP can create many tiny
          interfaces that complicate DIP injection. Strict DIP can make simple code verbose. Apply
          principles as guidelines, not rules — where the tradeoff makes sense for the complexity at hand.
        </li>
      </ul>

      <h2>FAQ — SOLID Principles in LLD Interviews</h2>

      <h3>Which SOLID principle is most commonly tested in LLD interviews?</h3>
      <p>
        SRP and OCP are the most frequently tested. SRP because most candidates over-stuff classes with
        unrelated responsibilities. OCP because the Strategy pattern — the canonical OCP implementation —
        appears in almost every LLD problem (pricing, splitting, assignment).
      </p>

      <h3>How do you explain DIP to an interviewer?</h3>
      <p>
        High-level logic should not know which database, email provider, or payment gateway it is using.
        It should program to an interface (InventoryRepository, EmailSender). The concrete implementation
        is injected at startup. This makes high-level modules testable in isolation and swappable without
        changing business logic.
      </p>

      <h3>What is the difference between SRP and ISP?</h3>
      <p>
        SRP applies to classes: one class, one reason to change. ISP applies to interfaces: one interface,
        one client role. A class can implement multiple narrow interfaces (ISP) and still have a single
        responsibility (SRP). Both principles reduce coupling, but at different levels of abstraction.
      </p>

      <h3>How do SOLID principles relate to design patterns?</h3>
      <p>
        Design patterns are concrete implementations of SOLID principles. Strategy implements OCP.
        Decorator implements OCP and SRP. Factory implements DIP (callers depend on an abstract factory,
        not concrete constructors). Observer implements SRP (separates event source from event handlers).
        Knowing both layers — the principle and the pattern — is what interviewers expect.
      </p>
    </>
  );
}
