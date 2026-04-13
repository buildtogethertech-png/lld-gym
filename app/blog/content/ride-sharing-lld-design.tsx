export default function Content() {
  return (
    <>
      <p>The Ride Sharing LLD problem (designing Uber or Ola) is one of the most commonly asked advanced LLD questions in product-based company interviews. It tests your ability to model real-time systems, state machines, and multiple interacting entities. This guide breaks down everything you need to ace it.</p>

      <h2>What Interviewers Are Testing</h2>
      <ul>
        <li>Can you model a multi-state real-time system?</li>
        <li>Do you understand the State pattern for driver lifecycle?</li>
        <li>Can you design an extensible fare calculation system?</li>
        <li>How do you handle asynchronous events like driver acceptance?</li>
      </ul>

      <h2>Core Requirements</h2>
      <ul>
        <li>Rider requests a ride with pickup and drop location</li>
        <li>System finds and assigns the nearest available driver</li>
        <li>Driver can accept or reject — timeout after 30 seconds</li>
        <li>Real-time trip status: Requested → Accepted → Ongoing → Completed</li>
        <li>Fare calculation based on distance, time, and ride type</li>
        <li>Post-trip ratings for both rider and driver</li>
        <li>Surge pricing during peak hours</li>
      </ul>

      <h2>Core Entities</h2>
      <ul>
        <li><strong>Rider</strong> — has profile, location, payment methods</li>
        <li><strong>Driver</strong> — has vehicle, current location, state</li>
        <li><strong>Trip</strong> — the central entity connecting rider, driver, route, fare</li>
        <li><strong>Location</strong> — latitude/longitude value object</li>
        <li><strong>RideRequest</strong> — captures pickup, drop, ride type</li>
        <li><strong>FareCalculator</strong> — strategy for pricing</li>
        <li><strong>MatchingService</strong> — finds nearest available driver</li>
      </ul>

      <h2>Driver State Machine</h2>
      <p>The State pattern is essential here. A driver is always in one of these states:</p>
      <pre>{`enum DriverState { OFFLINE, AVAILABLE, ON_TRIP, UNAVAILABLE }

class Driver {
  state: DriverState;
  location: Location;

  goOnline()  { this.state = DriverState.AVAILABLE; }
  goOffline() { this.state = DriverState.OFFLINE; }
  startTrip() { this.state = DriverState.ON_TRIP; }
  endTrip()   { this.state = DriverState.AVAILABLE; }
}`}</pre>

      <h2>Trip Lifecycle</h2>
      <pre>{`enum TripStatus {
  REQUESTED, DRIVER_ASSIGNED, DRIVER_ARRIVED,
  ONGOING, COMPLETED, CANCELLED
}

class Trip {
  id: string;
  rider: Rider;
  driver: Driver;
  pickup: Location;
  drop: Location;
  status: TripStatus;
  startTime: Date;
  endTime: Date;
  fare: number;
  rideType: RideType;  // ECONOMY | PREMIUM | XL
}`}</pre>

      <h2>Fare Calculation with Strategy Pattern</h2>
      <p>Different ride types have different rates. Surge pricing multiplies the base fare. Using Strategy keeps the Trip class clean:</p>
      <pre>{`interface FareStrategy {
  calculate(distanceKm: number, durationMin: number): number;
}

class EconomyFare implements FareStrategy {
  calculate(distanceKm: number, durationMin: number): number {
    return 50 + (distanceKm * 12) + (durationMin * 1.5);
  }
}

class SurgeFare implements FareStrategy {
  constructor(private base: FareStrategy, private multiplier: number) {}
  calculate(distanceKm: number, durationMin: number): number {
    return this.base.calculate(distanceKm, durationMin) * this.multiplier;
  }
}`}</pre>

      <h2>Driver Matching</h2>
      <p>In an interview, keep matching simple but extensible. Use a MatchingService that can swap algorithms:</p>
      <pre>{`interface MatchingStrategy {
  findDriver(request: RideRequest, drivers: Driver[]): Driver | null;
}

class NearestDriverStrategy implements MatchingStrategy {
  findDriver(request: RideRequest, drivers: Driver[]): Driver | null {
    return drivers
      .filter(d => d.state === DriverState.AVAILABLE)
      .filter(d => d.vehicle.supportsRideType(request.rideType))
      .sort((a, b) =>
        distance(a.location, request.pickup) -
        distance(b.location, request.pickup)
      )[0] ?? null;
  }
}`}</pre>

      <h2>Observer Pattern for Status Updates</h2>
      <p>Both rider and driver need real-time trip status updates. Use Observer:</p>
      <pre>{`interface TripObserver {
  onStatusChange(trip: Trip, newStatus: TripStatus): void;
}

class Trip {
  private observers: TripObserver[] = [];
  addObserver(o: TripObserver) { this.observers.push(o); }
  updateStatus(status: TripStatus) {
    this.status = status;
    this.observers.forEach(o => o.onStatusChange(this, status));
  }
}`}</pre>

      <h2>Common Interview Mistakes</h2>
      <ul>
        <li><strong>Embedding fare logic in Trip</strong> — violates SRP. Use FareStrategy.</li>
        <li><strong>Not modeling driver state transitions</strong> — interviewers specifically check this.</li>
        <li><strong>Ignoring driver rejection flow</strong> — what happens when all nearby drivers reject? Re-search with wider radius.</li>
        <li><strong>Missing RideType as an entity</strong> — Economy, Premium, XL have different vehicle requirements and pricing.</li>
      </ul>

      <h2>Follow-up Questions</h2>
      <ul>
        <li>"How do you implement surge pricing?" → Decorator on FareStrategy</li>
        <li>"How do you handle driver timeout?" → Timer + fallback to next driver</li>
        <li>"How do you track driver location in real time?" → Separate LocationService, event-driven updates</li>
        <li>"How would you support ride pooling?" → Trip becomes 1-to-many riders</li>
      </ul>

      <h2>Companies That Ask This</h2>
      <p>Uber, Ola, Swiggy (for delivery matching), Rapido, Porter, and increasingly Amazon (for logistics) ask this problem. It's a standard LLD problem for SDE-2 and above roles at product companies.</p>
    </>
  );
}
