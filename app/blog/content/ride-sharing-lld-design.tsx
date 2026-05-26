export default function Content() {
  return (
    <>
      <p>Ride Sharing Low Level Design — designing a system like Uber or Ola — is one of the most comprehensive LLD interview problems. It requires a trip state machine, driver-rider matching, surge pricing via the Strategy pattern, and real-time tracking via the Observer pattern. It is frequently asked at Uber, Ola, Swiggy, and Flipkart SDE interviews.</p>

      <h2>Why Interviewers Ask Ride Sharing LLD</h2>
      <ul>
        <li>Can you model a complex state machine — ride request through completion?</li>
        <li>Do you separate driver and rider as distinct entities with different responsibilities?</li>
        <li>Can you apply multiple design patterns in one solution?</li>
        <li>Do you think about matching algorithms and location-based queries?</li>
        <li>Can you design a rating system and handle cancellations cleanly?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Rider requests a ride with pickup and drop location</li>
        <li>System finds nearest available driver within a configurable radius</li>
        <li>Driver accepts or declines the ride request</li>
        <li>Trip goes through states: REQUESTED, DRIVER_ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED</li>
        <li>Fare calculated based on distance, time, and surge multiplier</li>
        <li>Rider and driver can rate each other after trip completion</li>
        <li>Rider can cancel before pickup; driver can cancel before pickup</li>
        <li>Real-time trip status updates sent to rider during trip</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Driver location updates every few seconds — geo-spatial indexing needed</li>
        <li>Matching must be fast — under 200ms even with thousands of available drivers</li>
        <li>Cancellation policy — fee applies if rider cancels after driver arrival</li>
      </ul>

      <h2>Core Entities</h2>
      <ul>
        <li><strong>Rider</strong> — id, name, phone, rating, paymentMethod</li>
        <li><strong>Driver</strong> — id, name, vehicle, currentLocation, status (AVAILABLE/ON_TRIP/OFFLINE)</li>
        <li><strong>Vehicle</strong> — licensePlate, type (BIKE/AUTO/CAR/PREMIUM)</li>
        <li><strong>Trip</strong> — id, rider, driver, pickup, drop, status, fare, startTime, endTime</li>
        <li><strong>Location</strong> — latitude, longitude</li>
        <li><strong>FareStrategy</strong> — interface; StandardFare, SurgeFare, FlatFare implement it</li>
        <li><strong>MatchingStrategy</strong> — interface; NearestDriver, HighestRating implement it</li>
        <li><strong>Rating</strong> — tripId, raterId, rateeId, score, comment</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Rider
+-- id, name, phone, rating: double
+-- currentTrip: Trip
+-- requestRide(pickup, drop, vehicleType): TripRequest

Driver
+-- id, name, vehicle: Vehicle
+-- location: Location
+-- status: DriverStatus
+-- acceptRide(trip): void
+-- declineRide(trip): void

Trip
+-- id: String
+-- rider: Rider, driver: Driver
+-- pickup: Location, drop: Location
+-- status: TripStatus
+-- fare: double
+-- startTime, endTime: LocalDateTime

TripStatus (enum)
  REQUESTED, DRIVER_ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED

FareStrategy (interface)
+-- calculateFare(trip): double
StandardFare implements FareStrategy
SurgeFare implements FareStrategy

MatchingStrategy (interface)
+-- findDriver(request, availableDrivers): Driver
NearestDriverStrategy implements MatchingStrategy`}</pre>

      <h2>Trip State Machine — Java</h2>
      <pre>{`public enum TripStatus {
    REQUESTED, DRIVER_ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
}

public class Trip {
    private TripStatus status = TripStatus.REQUESTED;

    public void assignDriver(Driver driver) {
        if (status != TripStatus.REQUESTED)
            throw new IllegalStateException("Cannot assign driver in status: " + status);
        this.driver = driver;
        this.status = TripStatus.DRIVER_ASSIGNED;
        notifyObservers(TripEvent.DRIVER_ASSIGNED);
    }

    public void startTrip() {
        if (status != TripStatus.DRIVER_ASSIGNED)
            throw new IllegalStateException("Cannot start trip in status: " + status);
        this.status = TripStatus.IN_PROGRESS;
        this.startTime = LocalDateTime.now();
        notifyObservers(TripEvent.TRIP_STARTED);
    }

    public void completeTrip() {
        if (status != TripStatus.IN_PROGRESS)
            throw new IllegalStateException("Cannot complete trip in status: " + status);
        this.status = TripStatus.COMPLETED;
        this.endTime = LocalDateTime.now();
        this.fare = fareStrategy.calculateFare(this);
        notifyObservers(TripEvent.TRIP_COMPLETED);
    }

    public void cancel(String reason) {
        if (status == TripStatus.IN_PROGRESS || status == TripStatus.COMPLETED)
            throw new IllegalStateException("Cannot cancel trip in status: " + status);
        this.status = TripStatus.CANCELLED;
        notifyObservers(TripEvent.TRIP_CANCELLED);
    }
}`}</pre>

      <h2>Surge Pricing — Strategy Pattern</h2>
      <pre>{`public interface FareStrategy {
    double calculateFare(Trip trip);
}

public class StandardFare implements FareStrategy {
    private static final double BASE_FARE = 30.0;
    private static final double PER_KM = 12.0;
    private static final double PER_MINUTE = 2.0;

    @Override
    public double calculateFare(Trip trip) {
        double distanceKm = trip.getDistanceKm();
        long minutes = ChronoUnit.MINUTES.between(trip.getStartTime(), trip.getEndTime());
        return BASE_FARE + (distanceKm * PER_KM) + (minutes * PER_MINUTE);
    }
}

public class SurgeFare implements FareStrategy {
    private final double surgeMultiplier;
    private final StandardFare baseFare = new StandardFare();

    public SurgeFare(double multiplier) { this.surgeMultiplier = multiplier; }

    @Override
    public double calculateFare(Trip trip) {
        return baseFare.calculateFare(trip) * surgeMultiplier;
    }
}`}</pre>

      <h2>Driver Matching</h2>
      <pre>{`public class NearestDriverStrategy implements MatchingStrategy {
    @Override
    public Optional<Driver> findDriver(TripRequest request, List<Driver> available) {
        return available.stream()
            .filter(d -> d.getStatus() == DriverStatus.AVAILABLE)
            .filter(d -> d.getVehicle().getType() == request.getVehicleType())
            .min(Comparator.comparingDouble(d ->
                calculateDistance(d.getLocation(), request.getPickup())));
    }

    private double calculateDistance(Location a, Location b) {
        // Haversine formula for geo distance
        double lat = Math.toRadians(b.getLat() - a.getLat());
        double lon = Math.toRadians(b.getLon() - a.getLon());
        double h = Math.sin(lat/2) * Math.sin(lat/2) +
                   Math.cos(Math.toRadians(a.getLat())) *
                   Math.cos(Math.toRadians(b.getLat())) *
                   Math.sin(lon/2) * Math.sin(lon/2);
        return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li><strong>State machine for Trip:</strong> Explicit state transitions with validation prevent illegal moves like completing a trip that was never started.</li>
        <li><strong>Strategy for fare and matching:</strong> Both are algorithms that need to change independently — surge pricing during peak hours, premium matching for high-rated riders. Injecting strategies at runtime enables this.</li>
        <li><strong>Observer for status updates:</strong> The rider's app, the driver's app, and the logging service all need trip status updates. Observer decouples the Trip from its consumers.</li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li><strong>"How do you handle driver location updates at scale?"</strong> — Use a geospatial index like a QuadTree or Redis GEO commands. Drivers push location updates every 3-5 seconds via WebSocket.</li>
        <li><strong>"How do you handle driver declining a ride?"</strong> — MatchingService retries with the next nearest driver. After N declines or timeout, the request fails with a "no driver available" message.</li>
        <li><strong>"How do you calculate surge pricing?"</strong> — Divide the city into zones (H3 hexagons). If demand/supply ratio in a zone exceeds a threshold, apply a surge multiplier. Recalculate every minute.</li>
      </ul>

      <h2>FAQ — Ride Sharing Low Level Design</h2>

      <h3>What design patterns are used in Uber/ride sharing LLD?</h3>
      <p>State pattern (trip lifecycle), Strategy pattern (fare calculation, driver matching), Observer pattern (real-time status updates), and Factory pattern (creating trips and vehicles).</p>

      <h3>What is the class diagram for ride sharing LLD?</h3>
      <p>Core classes: Rider, Driver (with Vehicle and Location), Trip (with TripStatus enum, FareStrategy, list of Observers), FareStrategy interface (StandardFare/SurgeFare), MatchingStrategy interface (NearestDriver), Rating.</p>

      <h3>How does driver matching work in ride sharing LLD?</h3>
      <p>The MatchingStrategy interface abstracts the algorithm. NearestDriverStrategy filters available drivers by vehicle type and sorts by geo-distance using the Haversine formula. In production, a geospatial index (QuadTree or Redis GEO) handles this efficiently at scale.</p>
    </>
  );
}
