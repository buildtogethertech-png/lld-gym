export default function Content() {
  return (
    <>
      <p>
        Design patterns are the vocabulary of LLD interviews. At Amazon, Flipkart, Swiggy, and Google,
        90% of LLD problems require one or more of the same 10 patterns. Knowing which pattern to apply —
        and why — is what separates good answers from great ones. This guide covers all 10 with real LLD
        examples, Java code, and when to use each.
      </p>

      <h2>Why Design Patterns Matter in LLD Interviews</h2>
      <p>
        An interviewer does not want to see a solution that works. They want to see a solution that is
        extensible, testable, and well-reasoned. Design patterns give you language to justify your
        decisions: "I used Strategy here because the pricing algorithm needs to be swappable without
        changing ParkingLot." That one sentence shows OCP awareness, pattern knowledge, and system
        thinking simultaneously.
      </p>

      <h2>1. Strategy Pattern</h2>
      <p>
        Define a family of algorithms, encapsulate each, and make them interchangeable. Use when behavior
        varies and you want to swap it without changing the class that uses it.
      </p>
      <pre>{`public interface PricingStrategy {
    double calculate(Ticket ticket, LocalDateTime exitTime);
}
public class HourlyPricing implements PricingStrategy { ... }
public class FlatRatePricing implements PricingStrategy { ... }

// ParkingLot uses PricingStrategy — swappable at construction
public class ParkingLot {
    private final PricingStrategy pricing;
    public Payment unpark(String ticketId) {
        double fee = pricing.calculate(ticket, LocalDateTime.now());
        ...
    }
}`}</pre>
      <p><strong>Where it appears:</strong> Parking Lot (pricing), Splitwise (split types), Rate Limiter (algorithms), Ride Sharing (fare calculation), Notification System (per-channel delivery).</p>

      <h2>2. Observer Pattern</h2>
      <p>
        Define a one-to-many dependency — when one object changes state, all dependents are notified
        automatically. Use for real-time updates, event-driven systems, and decoupled notifications.
      </p>
      <pre>{`public interface OrderObserver {
    void onStatusChange(Order order, OrderStatus newStatus);
}
public class PushNotificationObserver implements OrderObserver { ... }
public class AnalyticsObserver implements OrderObserver { ... }

public class OrderService {
    private final List<OrderObserver> observers = new ArrayList<>();
    public void updateStatus(Order order, OrderStatus status) {
        order.setStatus(status);
        observers.forEach(obs -> obs.onStatusChange(order, status));
    }
}`}</pre>
      <p><strong>Where it appears:</strong> Food Delivery (order updates), Chat App (message delivery), Social Feed (new post notifications), Logger (handlers), Inventory (low-stock alerts).</p>

      <h2>3. Factory Pattern</h2>
      <p>
        Create objects without specifying the exact class. Use when the type of object to create depends
        on runtime data and you want to centralize creation logic.
      </p>
      <pre>{`public class VehicleFactory {
    public static Vehicle create(String type, String licensePlate) {
        return switch (type.toUpperCase()) {
            case "BIKE"  -> new Bike(licensePlate);
            case "CAR"   -> new Car(licensePlate);
            case "TRUCK" -> new Truck(licensePlate);
            default      -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}`}</pre>
      <p><strong>Where it appears:</strong> Parking Lot (vehicle creation), Ride Sharing (ride type), Job Scheduler (command creation), Notification (channel creation).</p>

      <h2>4. Singleton Pattern</h2>
      <p>
        Ensure only one instance of a class exists and provide a global access point. Use for shared
        resources (config, connection pools, loggers) that must be consistent across the application.
      </p>
      <pre>{`public class ParkingLot {
    private static volatile ParkingLot instance;

    private ParkingLot() {}

    public static ParkingLot getInstance() {
        if (instance == null) {
            synchronized (ParkingLot.class) {
                if (instance == null) instance = new ParkingLot();
            }
        }
        return instance;
    }
}`}</pre>
      <p><strong>Where it appears:</strong> Parking Lot, Logger, Database connection pool, Cache manager.</p>

      <h2>5. State Pattern</h2>
      <p>
        Allow an object to alter its behavior when its internal state changes. The object will appear to
        change its class. Use for lifecycle management where behavior depends on current state.
      </p>
      <pre>{`public interface ElevatorState {
    void handleRequest(Elevator e, int floor);
    void move(Elevator e);
}
public class IdleState    implements ElevatorState { ... }
public class MovingUpState implements ElevatorState { ... }

public class Elevator {
    private ElevatorState state = new IdleState();
    public void setState(ElevatorState state) { this.state = state; }
    public void move() { state.move(this); } // delegates to current state
}`}</pre>
      <p><strong>Where it appears:</strong> Elevator System (elevator states), ATM Machine (card inserted, authenticated), Vending Machine, Traffic Light.</p>

      <h2>6. Command Pattern</h2>
      <p>
        Encapsulate a request as an object. Use when you need to parameterize actions, queue them, log
        them, or support undo operations.
      </p>
      <pre>{`public interface StockMovement {
    void execute();
    MovementType getType();
}
public class StockReceiveMovement implements StockMovement { ... }
public class StockDeductMovement  implements StockMovement { ... }

// InventoryService calls execute() and logs the command type
public void executeAndAudit(StockMovement movement) {
    movement.execute();
    auditLog.record(movement.getType(), ...);
}`}</pre>
      <p><strong>Where it appears:</strong> Inventory Management (stock movements), Job Scheduler (job commands), Text Editor (undo/redo), Elevator (floor requests).</p>

      <h2>7. Chain of Responsibility Pattern</h2>
      <p>
        Pass a request along a chain of handlers until one handles it (or all do). Use for ordered
        processing pipelines where each step decides to handle, modify, or pass the request.
      </p>
      <pre>{`public abstract class PaymentHandler {
    protected PaymentHandler next;
    public abstract PaymentResult handle(Payment p);
    protected PaymentResult proceed(Payment p) {
        return next != null ? next.handle(p) : PaymentResult.proceed();
    }
}
public class FraudCheckHandler extends PaymentHandler { ... }
public class LimitCheckHandler extends PaymentHandler { ... }

// Wire the chain
fraudHandler.setNext(limitHandler).setNext(authHandler);
PaymentResult result = fraudHandler.handle(payment);`}</pre>
      <p><strong>Where it appears:</strong> Payment Gateway (pre-payment checks), Logger (handlers), ATM (cash dispensing notes), API middleware.</p>

      <h2>8. Decorator Pattern</h2>
      <p>
        Attach additional responsibilities to an object dynamically. Decorators provide a flexible
        alternative to subclassing. Use when you want to add behavior without modifying the base class.
      </p>
      <pre>{`public class LoyaltyPricing implements PricingStrategy {
    private final PricingStrategy base; // wraps another strategy

    public LoyaltyPricing(PricingStrategy base, double discount) {
        this.base = base;
        this.discount = discount;
    }

    @Override
    public double calculatePrice(Room room, LocalDate checkIn, LocalDate checkOut) {
        return base.calculatePrice(room, checkIn, checkOut) * (1 - discount);
    }
}`}</pre>
      <p><strong>Where it appears:</strong> Hotel Booking (pricing layers), Logger (formatters), I/O streams (Java's own BufferedInputStream wraps InputStream).</p>

      <h2>9. Template Method Pattern</h2>
      <p>
        Define the skeleton of an algorithm in a base class, deferring some steps to subclasses.
        Use when multiple classes share the same algorithm structure with different details.
      </p>
      <pre>{`public abstract class ReportGenerator {
    // Template method — defines the algorithm skeleton
    public final Report generate(String period) {
        Data data = fetchData(period);   // step 1 — same for all
        Data processed = process(data);  // step 2 — varies per subclass
        return format(processed);        // step 3 — varies per subclass
    }

    protected abstract Data process(Data raw);
    protected abstract Report format(Data processed);
    private Data fetchData(String period) { ... } // shared
}

public class SalesReport extends ReportGenerator { ... }
public class InventoryReport extends ReportGenerator { ... }`}</pre>
      <p><strong>Where it appears:</strong> Notification System (send flow per channel), Report generation, Data import pipelines.</p>

      <h2>10. Repository Pattern</h2>
      <p>
        Encapsulate data access logic behind a collection-like interface. Use to decouple business logic
        from persistence concerns and to make services testable with mock repositories.
      </p>
      <pre>{`public interface BookRepository {
    Optional<Book> findByIsbn(String isbn);
    List<Book> findByAuthor(String author);
    void save(Book book);
}

public class SqlBookRepository implements BookRepository { ... }     // production
public class InMemoryBookRepository implements BookRepository { ... } // tests

// LibraryService depends on the interface, not the implementation
public class LibraryService {
    private final BookRepository bookRepo;
    public LibraryService(BookRepository repo) { this.bookRepo = repo; }
}`}</pre>
      <p><strong>Where it appears:</strong> Every LLD problem — BookRepository, OrderRepository, TicketRepository, UserRepository.</p>

      <h2>Pattern Selection Quick Guide</h2>
      <pre>{`Problem Symptom                      | Use This Pattern
------------------------------------ | ----------------
Multiple algorithms, same interface  | Strategy
React to events across classes       | Observer
Create objects based on runtime type | Factory
One instance across entire app       | Singleton
Object behavior changes with state   | State
Log, queue, or undo an operation     | Command
Sequential processing pipeline       | Chain of Responsibility
Add behavior without changing class  | Decorator
Same algorithm, different details    | Template Method
Decouple DB access from business     | Repository`}</pre>

      <h2>FAQ — Design Patterns for LLD Interviews</h2>

      <h3>Which design pattern is most commonly asked in LLD interviews?</h3>
      <p>
        Strategy pattern appears in almost every LLD problem — pricing, split types, rate limiting
        algorithms, assignment strategies, notification channels. If you master one pattern for LLD
        interviews, make it Strategy. Observer is a close second, appearing wherever real-time updates
        or event notifications are required.
      </p>

      <h3>What is the difference between Strategy and Template Method?</h3>
      <p>
        Strategy uses composition — the varying algorithm is a separate object injected into the context.
        Template Method uses inheritance — the varying steps are abstract methods in the base class.
        Strategy is more flexible (swap at runtime) and more testable (mock the strategy). Template
        Method is simpler but couples the variant to the base class through inheritance.
      </p>

      <h3>When should you use Factory vs Constructor directly?</h3>
      <p>
        Use a Factory when: the type of object to create depends on runtime data, creation involves
        complex logic, or you want to centralize creation to make future changes easier. Use a constructor
        directly for simple objects where the caller knows the exact type and there is no creation
        complexity.
      </p>

      <h3>How do you explain the Chain of Responsibility to an interviewer?</h3>
      <p>
        "I have a sequence of checks that must run in order before processing a payment. Each check is
        independent — fraud check does not know about limit check. If any check rejects the payment, it
        short-circuits. Chain of Responsibility lets me add, remove, or reorder checks without changing
        the payment processing logic."
      </p>
    </>
  );
}
