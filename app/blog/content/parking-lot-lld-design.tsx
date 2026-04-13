export default function Content() {
  return (
    <>
      <p>The Parking Lot system is one of the most frequently asked Low Level Design problems in software engineering interviews. Companies like Amazon, Flipkart, Microsoft, and Uber use this problem to evaluate your understanding of Object-Oriented Design, SOLID principles, and design patterns. In this guide, we'll walk through the complete solution from requirements to code structure.</p>

      <h2>Why Interviewers Ask This Problem</h2>
      <p>The Parking Lot problem is deceptively simple on the surface but reveals a lot about how you think. Interviewers want to see:</p>
      <ul>
        <li>Can you identify the right entities without over-engineering?</li>
        <li>Do you apply the Single Responsibility Principle?</li>
        <li>Can you use the Strategy pattern for extensible pricing?</li>
        <li>Do you think about edge cases like concurrent access?</li>
      </ul>

      <h2>Requirements Breakdown</h2>
      <p>Before writing a single class, clarify the requirements. Here's what a complete Parking Lot system needs:</p>
      <ul>
        <li>Multiple floors, each with configurable slot counts</li>
        <li>Three vehicle types: Bike, Car, Truck (each needs different slot size)</li>
        <li>Allocate the nearest available slot to an incoming vehicle</li>
        <li>Generate a ticket on entry, calculate fee on exit</li>
        <li>Different pricing per vehicle type</li>
        <li>Free up the slot when a vehicle exits</li>
      </ul>
      <p>A common mistake is jumping to code before asking these questions. Always spend 3–5 minutes on requirements gathering in an interview.</p>

      <h2>Identifying Core Entities</h2>
      <p>The key to LLD is identifying the right nouns from the requirements. For the Parking Lot:</p>
      <ul>
        <li><strong>ParkingLot</strong> — the top-level entry point, manages floors</li>
        <li><strong>Floor</strong> — contains slots, knows its floor number</li>
        <li><strong>Slot</strong> — has a size (Small/Medium/Large) and holds one vehicle</li>
        <li><strong>Vehicle</strong> — abstract class with Bike, Car, Truck as subtypes</li>
        <li><strong>Ticket</strong> — records entry time, vehicle, and assigned slot</li>
        <li><strong>PricingStrategy</strong> — calculates fee based on vehicle type and duration</li>
      </ul>

      <h2>Class Structure</h2>
      <pre>{`// Vehicle hierarchy
abstract class Vehicle {
  licensePlate: string;
  abstract getSize(): VehicleSize;
}
class Bike extends Vehicle { getSize() { return VehicleSize.SMALL; } }
class Car  extends Vehicle { getSize() { return VehicleSize.MEDIUM; } }
class Truck extends Vehicle { getSize() { return VehicleSize.LARGE; } }

// Slot
class Slot {
  id: string;
  floor: number;
  size: VehicleSize;
  isOccupied: boolean;
  vehicle: Vehicle | null;
}

// Ticket issued on entry
class Ticket {
  ticketId: string;
  vehicle: Vehicle;
  slot: Slot;
  entryTime: Date;
}

// Strategy interface for pricing
interface PricingStrategy {
  calculateFee(vehicle: Vehicle, durationMinutes: number): number;
}

// ParkingLot — the facade
class ParkingLot {
  floors: Floor[];
  pricing: PricingStrategy;

  parkVehicle(vehicle: Vehicle): Ticket | null { ... }
  exitVehicle(ticket: Ticket): number { ... }  // returns fee
}`}</pre>

      <h2>Key Design Decision: Strategy Pattern for Pricing</h2>
      <p>Pricing varies by vehicle type and could change (surge pricing, monthly passes). Using the Strategy pattern keeps the core ParkingLot class closed for modification but open for extension — this is the Open/Closed Principle in action.</p>
      <pre>{`class HourlyPricing implements PricingStrategy {
  private rates = {
    [VehicleSize.SMALL]:  20,  // ₹20/hr for bikes
    [VehicleSize.MEDIUM]: 40,  // ₹40/hr for cars
    [VehicleSize.LARGE]:  80,  // ₹80/hr for trucks
  };

  calculateFee(vehicle: Vehicle, durationMinutes: number): number {
    const hours = Math.ceil(durationMinutes / 60);
    return this.rates[vehicle.getSize()] * hours;
  }
}`}</pre>

      <h2>Finding the Nearest Slot</h2>
      <p>Iterating floor by floor, slot by slot gives you the nearest slot without complex data structures. For a real system you'd use a priority queue, but in an interview, a clean linear scan is acceptable and easier to reason about.</p>
      <pre>{`parkVehicle(vehicle: Vehicle): Ticket | null {
  for (const floor of this.floors) {
    const slot = floor.findAvailableSlot(vehicle.getSize());
    if (slot) {
      slot.assignVehicle(vehicle);
      return new Ticket(vehicle, slot, new Date());
    }
  }
  return null; // Parking full
}`}</pre>

      <h2>Common Mistakes Interviewers Look For</h2>
      <ul>
        <li><strong>Putting pricing logic in Vehicle or Slot</strong> — violates SRP. Pricing belongs in its own strategy.</li>
        <li><strong>Using if-else for vehicle type matching</strong> — use polymorphism instead.</li>
        <li><strong>Not separating Ticket from Vehicle</strong> — a vehicle can have multiple tickets across visits.</li>
        <li><strong>Forgetting thread safety</strong> — in a real system, slot allocation must be synchronized.</li>
      </ul>

      <h2>Follow-up Questions Interviewers Ask</h2>
      <ul>
        <li>"How would you support monthly passes?" → Add a PricingStrategy subclass</li>
        <li>"How would you handle concurrent entries?" → Synchronize slot allocation, use optimistic locking</li>
        <li>"How would you add EV charging slots?" → Add a ChargeableSlot subtype</li>
        <li>"How would you track revenue?" → Observer pattern — emit event on each payment</li>
      </ul>

      <h2>Which Companies Ask This</h2>
      <p>Amazon (SDE-2 onsite), Flipkart (LLD round), Microsoft (design round), Uber (backend engineer), Paytm, PhonePe, and most product-based companies in India use this as a screening LLD problem.</p>
    </>
  );
}
