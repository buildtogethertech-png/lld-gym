export default function Content() {
  return (
    <>
      <p>
        Hotel Booking System (OYO / Booking.com) Low Level Design is a popular problem in product-based
        SDE interviews. It covers room availability management, dynamic pricing, concurrent reservation
        safety, and cancellation policy. Frequently asked at OYO, MakeMyTrip, and Expedia, this guide
        covers the complete Hotel Booking LLD with Java code, class diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Hotel Booking LLD</h2>
      <p>
        The hotel booking problem is a nuanced variation of the movie ticket booking problem. Interviewers
        want to see:
      </p>
      <ul>
        <li>Can you model room availability across date ranges (not just timeslots)?</li>
        <li>Do you use Strategy pattern for dynamic and seasonal pricing?</li>
        <li>Can you prevent double-booking with optimistic locking or row-level locks?</li>
        <li>Do you design cancellation policy as a first-class concept?</li>
        <li>Can you model Hotel, Room, RoomType, and Reservation as distinct entities?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Users can search hotels by city, check-in date, check-out date, and guests</li>
        <li>Each hotel has multiple room types (Standard, Deluxe, Suite) with different prices</li>
        <li>Users can book a room — system reserves it for the requested date range</li>
        <li>Booking confirmation after payment; cancellation within the cancellation window</li>
        <li>Cancellation policy: free within 24 hours, 50% refund within 7 days, no refund after</li>
        <li>Hotel managers can update room availability and prices</li>
        <li>Admin can view all reservations and revenue per hotel</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>No two users can book the same room for overlapping dates</li>
        <li>Room availability queries must be fast — indexed by date range</li>
        <li>Adding a new pricing strategy (e.g., loyalty discount) must not change booking logic</li>
        <li>Cancellation refund calculation must be deterministic and auditable</li>
      </ul>

      <h2>Core Entities — Hotel Booking LLD Class Design</h2>
      <ul>
        <li><strong>Hotel</strong> — id, name, city, starRating, amenities, rooms</li>
        <li><strong>RoomType</strong> — STANDARD / DELUXE / SUITE — defines base price and capacity</li>
        <li><strong>Room</strong> — id, hotel, roomNumber, roomType, floor, amenities</li>
        <li><strong>Reservation</strong> — id, user, room, checkIn, checkOut, totalPrice, status</li>
        <li><strong>PricingStrategy</strong> — interface; BasePricing, SeasonalPricing, LoyaltyPricing</li>
        <li><strong>CancellationPolicy</strong> — interface; FreeWithin24h, TieredRefundPolicy</li>
        <li><strong>Payment</strong> — reservationId, amount, method, status, refundAmount</li>
        <li><strong>RoomAvailabilityService</strong> — checks and reserves date ranges</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Hotel
+-- id, name, city: String
+-- starRating: int
+-- rooms: List<Room>

RoomType (enum)
+-- STANDARD, DELUXE, SUITE
+-- basePrice: double
+-- maxGuests: int

Room
+-- id, roomNumber: String
+-- hotel: Hotel
+-- roomType: RoomType
+-- floor: int

Reservation
+-- id, user: User, room: Room
+-- checkIn, checkOut: LocalDate
+-- totalPrice: double
+-- status: ReservationStatus (PENDING/CONFIRMED/CANCELLED)
+-- paymentId: String

PricingStrategy (interface)
+-- calculatePrice(room, checkIn, checkOut): double

BasePricing       implements PricingStrategy
SeasonalPricing   implements PricingStrategy
LoyaltyPricing    implements PricingStrategy

CancellationPolicy (interface)
+-- calculateRefund(reservation, cancelledAt): double

TieredRefundPolicy implements CancellationPolicy`}</pre>

      <h2>Pricing Strategies — Java</h2>
      <pre>{`public interface PricingStrategy {
    double calculatePrice(Room room, LocalDate checkIn, LocalDate checkOut);
}

public class BasePricing implements PricingStrategy {
    @Override
    public double calculatePrice(Room room, LocalDate checkIn, LocalDate checkOut) {
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        return room.getRoomType().getBasePrice() * nights;
    }
}

public class SeasonalPricing implements PricingStrategy {
    private final PricingStrategy base = new BasePricing();

    @Override
    public double calculatePrice(Room room, LocalDate checkIn, LocalDate checkOut) {
        double basePrice = base.calculatePrice(room, checkIn, checkOut);
        double multiplier = isSeason(checkIn) ? 1.5 : 1.0;
        return basePrice * multiplier;
    }

    private boolean isSeason(LocalDate date) {
        int month = date.getMonthValue();
        return month == 12 || month == 1 || (month >= 6 && month <= 8); // winter + summer peak
    }
}

public class LoyaltyPricing implements PricingStrategy {
    private final PricingStrategy base;
    private final double discountRate;

    public LoyaltyPricing(PricingStrategy base, double discountRate) {
        this.base = base;
        this.discountRate = discountRate; // e.g., 0.10 for 10% off
    }

    @Override
    public double calculatePrice(Room room, LocalDate checkIn, LocalDate checkOut) {
        return base.calculatePrice(room, checkIn, checkOut) * (1 - discountRate);
    }
}`}</pre>

      <h2>Room Availability and Concurrent Reservation Safety</h2>
      <pre>{`public class RoomAvailabilityService {
    private final ReservationRepository reservationRepo;

    public List<Room> findAvailableRooms(String city, LocalDate checkIn, LocalDate checkOut, RoomType type) {
        List<Hotel> hotels = hotelRepo.findByCity(city);
        return hotels.stream()
            .flatMap(h -> h.getRooms().stream())
            .filter(r -> r.getRoomType() == type)
            .filter(r -> isAvailable(r.getId(), checkIn, checkOut))
            .collect(Collectors.toList());
    }

    public boolean isAvailable(String roomId, LocalDate checkIn, LocalDate checkOut) {
        // Check for overlapping CONFIRMED reservations
        // Overlap condition: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
        return reservationRepo.countOverlapping(roomId, checkIn, checkOut, ReservationStatus.CONFIRMED) == 0;
    }

    // Atomic check-and-reserve with optimistic locking
    public Reservation reserve(String roomId, String userId, LocalDate checkIn, LocalDate checkOut,
                                double price) {
        // Use DB-level constraint: unique(roomId, checkIn, status=CONFIRMED)
        // Or: SELECT FOR UPDATE on overlapping rows
        if (!isAvailable(roomId, checkIn, checkOut))
            throw new RoomNotAvailableException("Room already booked for these dates");

        Reservation res = new Reservation(UUID.randomUUID().toString(),
            userRepo.findById(userId), roomRepo.findById(roomId),
            checkIn, checkOut, price, ReservationStatus.PENDING);
        return reservationRepo.save(res); // DB constraint catches race conditions
    }
}`}</pre>

      <h2>Cancellation Policy</h2>
      <pre>{`public interface CancellationPolicy {
    double calculateRefund(Reservation reservation, LocalDateTime cancelledAt);
}

public class TieredRefundPolicy implements CancellationPolicy {
    @Override
    public double calculateRefund(Reservation reservation, LocalDateTime cancelledAt) {
        long hoursBeforeCheckIn = ChronoUnit.HOURS.between(cancelledAt,
            reservation.getCheckIn().atStartOfDay());

        if (hoursBeforeCheckIn >= 24 * 7) return reservation.getTotalPrice(); // full refund > 7 days
        if (hoursBeforeCheckIn >= 24)     return reservation.getTotalPrice() * 0.5; // 50% within 7 days
        return 0.0; // no refund within 24 hours
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Date range availability query:</strong> The overlap condition is: existing.checkIn
          is before requested.checkOut AND existing.checkOut is after requested.checkIn. This single
          predicate covers all overlap cases — partial, full containment, and identical dates.
        </li>
        <li>
          <strong>DB constraint as the last defense against double-booking:</strong> Application-level
          availability checks are subject to TOCTOU races. A database partial unique index on
          (roomId, status=CONFIRMED) with an overlap exclusion constraint (available in PostgreSQL)
          is the correct safety net.
        </li>
        <li>
          <strong>Cancellation policy as Strategy:</strong> Different room types or booking channels may
          have different cancellation terms. Storing the policy name on the Reservation at booking time
          ensures the correct policy is applied even if the default policy changes later.
        </li>
        <li>
          <strong>Decorator pattern for pricing:</strong> LoyaltyPricing wraps any base pricing strategy
          and applies a discount. SeasonalPricing can wrap BasePricing. Pricing policies compose without
          modifying existing classes.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you handle check-in time vs check-out time within the same day?"</strong> —
          Add checkInTime and checkOutTime to Reservation. Default check-in: 2pm, check-out: 11am. A room
          booked from Day 1 to Day 3 check-out is available again from Day 3 2pm onwards.
        </li>
        <li>
          <strong>"How do you support multi-room bookings for a group?"</strong> — A Booking entity groups
          multiple Reservations. Payment is made at the Booking level. Cancellation cancels all reservations
          in the booking atomically.
        </li>
        <li>
          <strong>"How do you update room prices for future bookings without affecting existing ones?"</strong>
          — Store totalPrice on the Reservation at booking time. Price changes affect future bookings only.
          Historical prices are immutable — preserved in the Reservation record.
        </li>
      </ul>

      <h2>FAQ — Hotel Booking System Low Level Design</h2>

      <h3>What design patterns are used in Hotel Booking LLD?</h3>
      <p>
        The primary patterns are <strong>Strategy</strong> (PricingStrategy — Base, Seasonal, Loyalty),
        <strong>Decorator</strong> (LoyaltyPricing wraps other pricing strategies),
        <strong>Template Method</strong> (booking flow: search → select → pay → confirm), and
        <strong>State Machine</strong> (Reservation status: PENDING → CONFIRMED → CANCELLED).
      </p>

      <h3>How do you prevent double-booking in a hotel system?</h3>
      <p>
        At the application layer: check for overlapping CONFIRMED reservations before creating a new one.
        At the database layer: use a partial unique index or exclusion constraint (PostgreSQL tsrange with
        EXCLUDE) on (roomId, dateRange) where status=CONFIRMED. The DB constraint is the authoritative
        guard — the application check is an optimization to give users a better error message.
      </p>

      <h3>How do you model room availability across date ranges?</h3>
      <p>
        Query reservations where (checkIn is before requested checkOut) AND (checkOut is after requested
        checkIn). Any row matching this condition means the room is unavailable. Index on roomId and
        checkIn for query performance. Store availability as an in-memory calendar per room for
        sub-millisecond lookups in high-traffic scenarios.
      </p>

      <h3>How do you handle hotel cancellation policies?</h3>
      <p>
        Model CancellationPolicy as a Strategy interface with calculateRefund(reservation, cancelAt). Record
        the policy name on the Reservation at booking time (not a foreign key — the policy text may change).
        On cancellation, instantiate the saved policy and compute the refund. This ensures historical
        reservations always use the policy they were booked under.
      </p>
    </>
  );
}
