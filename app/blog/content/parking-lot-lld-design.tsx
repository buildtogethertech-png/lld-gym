export default function Content() {
  return (
    <>
      <p>
        The Parking Lot system is one of the most frequently asked Low Level Design problems in software engineering
        interviews. Companies like Amazon, Flipkart, Microsoft, and Uber use this problem to evaluate your
        understanding of Object-Oriented Design, SOLID principles, and the Strategy design pattern. In this complete
        parking lot LLD guide, we go from requirements to class diagram to working Java code.
      </p>

      <h2>Why Interviewers Ask the Parking Lot LLD Problem</h2>
      <p>
        The Parking Lot problem is deceptively simple on the surface but reveals a lot about how you think.
        Interviewers want to see:
      </p>
      <ul>
        <li>Can you identify the right entities without over-engineering?</li>
        <li>Do you apply Single Responsibility Principle — each class does one thing?</li>
        <li>Can you use the Strategy pattern for extensible pricing?</li>
        <li>Do you think about edge cases like concurrent access and finding the nearest slot?</li>
        <li>Can you model enums cleanly for vehicle types and slot sizes?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Support multiple floors, each with a configurable number of slots</li>
        <li>Three vehicle types: Bike, Car, Truck — each requires a different slot size</li>
        <li>Allocate the nearest available slot to an incoming vehicle</li>
        <li>Issue a ticket on entry with timestamp and slot details</li>
        <li>Calculate parking fee on exit based on duration and vehicle type</li>
        <li>Free up the slot when a vehicle exits</li>
        <li>Display available slot count per floor and vehicle type</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Concurrent entry and exit must be handled safely — no double-allocation of slots</li>
        <li>Adding a new vehicle type or pricing strategy must not require modifying existing classes (OCP)</li>
        <li>Slot search should be O(1) or O(floors) using data structures, not a full O(n) scan</li>
      </ul>

      <h2>Core Entities — Parking Lot LLD Class Design</h2>
      <ul>
        <li><strong>ParkingLot</strong> — singleton, manages all floors, entry and exit</li>
        <li><strong>Floor</strong> — contains slots, tracks availability per slot type</li>
        <li><strong>Slot</strong> — type (SMALL/MEDIUM/LARGE), number, floor, occupied status</li>
        <li><strong>Vehicle</strong> — abstract base; Bike, Car, Truck extend it</li>
        <li><strong>Ticket</strong> — issued at entry: vehicle, slot, entry time</li>
        <li><strong>PricingStrategy</strong> — interface; HourlyPricing, FlatRatePricing implement it</li>
        <li><strong>Payment</strong> — amount, method, timestamp</li>
        <li><strong>EntrancePanel / ExitPanel</strong> — hardware interface abstractions</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`ParkingLot (Singleton)
+-- floors: List<Floor>
+-- pricingStrategy: PricingStrategy
+-- activeTickets: Map<String, Ticket>
+-- parkVehicle(vehicle): Ticket
+-- unparkVehicle(ticketId): Payment

Floor
+-- floorNumber: int
+-- slots: List<Slot>
+-- getNearestAvailableSlot(type): Slot

Slot
+-- slotNumber: int
+-- type: SlotType (SMALL / MEDIUM / LARGE)
+-- isOccupied: boolean
+-- assignVehicle() / free()

Vehicle (abstract)
+-- licensePlate: String
+-- type: VehicleType
Bike / Car / Truck extend Vehicle

Ticket
+-- ticketId: String
+-- vehicle: Vehicle
+-- slot: Slot
+-- entryTime: LocalDateTime

PricingStrategy (interface)
+-- calculateFee(ticket, exitTime): double

HourlyPricing implements PricingStrategy
FlatRatePricing implements PricingStrategy`}</pre>

      <h2>Strategy Pattern for Pricing — Java</h2>
      <pre>{`public interface PricingStrategy {
    double calculateFee(Ticket ticket, LocalDateTime exitTime);
}

public class HourlyPricing implements PricingStrategy {
    private final Map<VehicleType, Double> ratePerHour = new EnumMap<>(VehicleType.class);

    public HourlyPricing() {
        ratePerHour.put(VehicleType.BIKE,  10.0);
        ratePerHour.put(VehicleType.CAR,   20.0);
        ratePerHour.put(VehicleType.TRUCK, 50.0);
    }

    @Override
    public double calculateFee(Ticket ticket, LocalDateTime exitTime) {
        long hours = ChronoUnit.HOURS.between(ticket.getEntryTime(), exitTime);
        hours = Math.max(hours, 1); // minimum 1 hour
        return hours * ratePerHour.get(ticket.getVehicle().getType());
    }
}`}</pre>

      <h2>ParkingLot Core Logic</h2>
      <pre>{`public class ParkingLot {
    private static ParkingLot instance;
    private final List<Floor> floors;
    private final PricingStrategy pricingStrategy;
    private final Map<String, Ticket> activeTickets = new ConcurrentHashMap<>();

    private ParkingLot(List<Floor> floors, PricingStrategy strategy) {
        this.floors = floors;
        this.pricingStrategy = strategy;
    }

    public static synchronized ParkingLot getInstance(List<Floor> floors, PricingStrategy strategy) {
        if (instance == null) instance = new ParkingLot(floors, strategy);
        return instance;
    }

    public Ticket parkVehicle(Vehicle vehicle) {
        SlotType required = SlotType.forVehicle(vehicle.getType());
        for (Floor floor : floors) {
            Slot slot = floor.getNearestAvailableSlot(required);
            if (slot != null) {
                slot.assignVehicle(vehicle);
                Ticket ticket = new Ticket(UUID.randomUUID().toString(),
                                           vehicle, slot, LocalDateTime.now());
                activeTickets.put(ticket.getTicketId(), ticket);
                return ticket;
            }
        }
        throw new ParkingFullException("No slot available for " + vehicle.getType());
    }

    public Payment unparkVehicle(String ticketId) {
        Ticket ticket = activeTickets.remove(ticketId);
        if (ticket == null) throw new InvalidTicketException(ticketId);
        LocalDateTime exitTime = LocalDateTime.now();
        double fee = pricingStrategy.calculateFee(ticket, exitTime);
        ticket.getSlot().free();
        return new Payment(fee, PaymentMethod.CASH, exitTime);
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Singleton ParkingLot:</strong> Only one instance should exist per system. Use
          double-checked locking or an enum-based singleton for thread safety in a multi-threaded environment.
        </li>
        <li>
          <strong>Strategy over inheritance for pricing:</strong> Subclassing ParkingLot per pricing model
          violates SRP. With Strategy, adding a weekend rate or EV discount is a new class — zero changes to
          existing code.
        </li>
        <li>
          <strong>ConcurrentHashMap for active tickets:</strong> Multiple entry and exit lanes run in parallel.
          ConcurrentHashMap provides thread-safe put/remove without a global lock.
        </li>
        <li>
          <strong>SlotType maps to VehicleType:</strong> Bike → SMALL, Car → MEDIUM, Truck → LARGE. Keep this
          mapping in one place — a static factory method on SlotType — not scattered across callers.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you handle two vehicles racing for the same slot?"</strong> — Synchronize
          <code>getNearestAvailableSlot + assignVehicle</code> at the floor level, or use an atomic
          CAS operation on the slot's occupied flag.
        </li>
        <li>
          <strong>"How do you support EV charging slots?"</strong> — Add a <code>SlotFeature</code> enum
          (REGULAR, EV_CHARGING, HANDICAP). Slot gets a feature field. Search filters by feature when needed.
        </li>
        <li>
          <strong>"How do you find the nearest slot efficiently?"</strong> — Each floor maintains a sorted set
          or min-heap of available slot numbers per type. getNearestAvailableSlot is O(log n).
        </li>
        <li>
          <strong>"How would you add monthly subscription support?"</strong> — Vehicle gets an optional
          Subscription. PricingStrategy checks for an active subscription before calculating the hourly fee.
        </li>
      </ul>

      <h2>FAQ — Parking Lot Low Level Design</h2>

      <h3>What design patterns are used in Parking Lot LLD?</h3>
      <p>
        The primary patterns are <strong>Strategy</strong> (swap pricing algorithms without changing ParkingLot),
        <strong>Singleton</strong> (one ParkingLot instance), and <strong>Factory</strong> (create Vehicle objects
        from a type string). The <strong>Observer pattern</strong> is optionally used to update a display board
        when slot availability changes.
      </p>

      <h3>What is the class diagram for a Parking Lot system?</h3>
      <p>
        Core classes: ParkingLot (singleton) → Floor → Slot, Vehicle (abstract) → Bike/Car/Truck,
        Ticket (links Vehicle + Slot + entry time), PricingStrategy → HourlyPricing/FlatRatePricing, Payment.
        ParkingLot has many Floors; each Floor has many Slots.
      </p>

      <h3>How do you handle concurrent parking in Parking Lot LLD?</h3>
      <p>
        Use <code>ConcurrentHashMap</code> for active tickets and synchronize slot assignment at the floor level.
        Alternatively, use an atomic boolean in Slot with <code>compareAndSet</code> so only one thread can mark
        a slot occupied at a time.
      </p>

      <h3>Is the Parking Lot problem easy or hard?</h3>
      <p>
        Beginner to intermediate. Entities are clear, the Strategy pattern is textbook, and the concurrency
        requirement adds depth. It is the best first LLD problem because it covers fundamentals — entities,
        relationships, a design pattern, and edge cases — without overwhelming complexity.
      </p>
    </>
  );
}
