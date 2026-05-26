export default function Content() {
  return (
    <>
      <p>
        Movie Ticket Booking (BookMyShow) is one of the most concurrency-heavy Low Level Design problems in
        software engineering interviews. It requires seat locking, concurrent reservation safety, and a
        multi-stage booking flow. Frequently asked at Swiggy, Razorpay, BookMyShow, and Flipkart, this guide
        covers the complete LLD solution with Java code, class diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Movie Ticket Booking LLD</h2>
      <p>
        This problem is a concurrency stress test wrapped in a familiar domain. Interviewers use it to see:
      </p>
      <ul>
        <li>Can you model the seat locking flow — temporary hold, confirm, expire?</li>
        <li>Do you prevent double-booking without a global lock that kills throughput?</li>
        <li>Can you use Strategy pattern for dynamic and category-based pricing?</li>
        <li>Do you separate Show, Screen, and Movie as distinct entities?</li>
        <li>Can you design a booking state machine (PENDING → CONFIRMED → CANCELLED)?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Users can browse movies, cinemas, and shows for a given date and city</li>
        <li>User selects a show and views the seat map with availability</li>
        <li>User selects seats — system temporarily locks them for 10 minutes</li>
        <li>User completes payment — booking is confirmed and seats are permanently reserved</li>
        <li>If payment fails or times out, seat lock is released automatically</li>
        <li>User can cancel a confirmed booking (refund policy applies)</li>
        <li>Support multiple seat categories: Regular, Premium, Recliner</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>No two users must be able to book the same seat for the same show</li>
        <li>Seat lock must auto-expire after 10 minutes without a global scan loop</li>
        <li>Seat availability queries must be fast — O(1) per show</li>
        <li>System must handle thousands of concurrent seat selection requests</li>
      </ul>

      <h2>Core Entities — Movie Ticket Booking LLD Class Design</h2>
      <ul>
        <li><strong>Movie</strong> — id, title, genre, duration, language</li>
        <li><strong>Cinema</strong> — id, name, city, list of screens</li>
        <li><strong>Screen</strong> — id, screenNumber, list of seats, seating layout</li>
        <li><strong>Show</strong> — id, movie, screen, startTime, pricing per category</li>
        <li><strong>Seat</strong> — id, row, column, category (REGULAR/PREMIUM/RECLINER), status</li>
        <li><strong>SeatLock</strong> — seatId, showId, userId, lockedAt, expiresAt</li>
        <li><strong>Booking</strong> — id, show, user, seats, totalAmount, status, paymentId</li>
        <li><strong>PricingStrategy</strong> — interface; CategoryPricing, SurgePricing implement it</li>
        <li><strong>Payment</strong> — bookingId, amount, method, status, timestamp</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Movie
+-- id, title, genre, durationMinutes, language

Cinema
+-- id, name, city
+-- screens: List<Screen>

Screen
+-- id, screenNumber
+-- seats: List<Seat>
+-- totalCapacity: int

Show
+-- id, movie: Movie, screen: Screen
+-- startTime: LocalDateTime
+-- categoryPrices: Map<SeatCategory, Double>
+-- getAvailableSeats(): List<Seat>

Seat
+-- id, row: char, column: int
+-- category: SeatCategory (REGULAR/PREMIUM/RECLINER)
+-- status: SeatStatus (AVAILABLE/LOCKED/BOOKED)

SeatLock
+-- seatId, showId, userId
+-- lockedAt, expiresAt: LocalDateTime

Booking
+-- id, show: Show, user: User
+-- seats: List<Seat>
+-- totalAmount: double
+-- status: BookingStatus (PENDING/CONFIRMED/CANCELLED)
+-- paymentId: String

PricingStrategy (interface)
+-- calculatePrice(show, seats): double

CategoryPricing implements PricingStrategy
SurgePricing    implements PricingStrategy`}</pre>

      <h2>Seat Locking with Concurrent Safety — Java</h2>
      <p>
        The seat locking service is the most critical component. It must guarantee atomicity — if two users
        click the same seat simultaneously, exactly one must succeed. Using a per-show lock (not a global lock)
        limits contention to users within the same show.
      </p>
      <pre>{`public class SeatLockService {
    private static final int LOCK_DURATION_MINUTES = 10;

    // One ReentrantLock per show — limits contention to the same show only
    private final ConcurrentHashMap<String, ReentrantLock> showLocks = new ConcurrentHashMap<>();
    private final Map<String, SeatLock> activeLocks = new HashMap<>(); // showId+seatId -> SeatLock

    private ReentrantLock getShowLock(String showId) {
        return showLocks.computeIfAbsent(showId, k -> new ReentrantLock());
    }

    public boolean lockSeats(String showId, List<String> seatIds, String userId) {
        ReentrantLock lock = getShowLock(showId);
        lock.lock();
        try {
            // Check all seats are available (not locked or booked)
            for (String seatId : seatIds) {
                String key = showId + ":" + seatId;
                SeatLock existing = activeLocks.get(key);
                if (existing != null && !existing.isExpired()) return false;
            }
            // Lock all seats atomically
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiry = now.plusMinutes(LOCK_DURATION_MINUTES);
            for (String seatId : seatIds) {
                String key = showId + ":" + seatId;
                activeLocks.put(key, new SeatLock(seatId, showId, userId, now, expiry));
            }
            return true;
        } finally {
            lock.unlock();
        }
    }

    public void releaseLocks(String showId, List<String> seatIds) {
        ReentrantLock lock = getShowLock(showId);
        lock.lock();
        try {
            seatIds.forEach(id -> activeLocks.remove(showId + ":" + id));
        } finally {
            lock.unlock();
        }
    }

    public boolean isLockedByUser(String showId, String seatId, String userId) {
        SeatLock sl = activeLocks.get(showId + ":" + seatId);
        return sl != null && sl.getUserId().equals(userId) && !sl.isExpired();
    }
}`}</pre>

      <h2>Pricing Strategy — Category and Surge Pricing</h2>
      <pre>{`public interface PricingStrategy {
    double calculatePrice(Show show, List<Seat> seats);
}

public class CategoryPricing implements PricingStrategy {
    @Override
    public double calculatePrice(Show show, List<Seat> seats) {
        return seats.stream()
            .mapToDouble(seat -> show.getCategoryPrices()
                .getOrDefault(seat.getCategory(), 150.0))
            .sum();
    }
}

public class SurgePricing implements PricingStrategy {
    private final PricingStrategy basePricing = new CategoryPricing();

    @Override
    public double calculatePrice(Show show, List<Seat> seats) {
        double base = basePricing.calculatePrice(show, seats);
        double occupancyRate = show.getOccupancyRate(); // booked / total
        double multiplier = occupancyRate > 0.8 ? 1.5 : (occupancyRate > 0.6 ? 1.2 : 1.0);
        return base * multiplier;
    }
}`}</pre>

      <h2>BookingService — Full Booking Flow</h2>
      <pre>{`public class BookingService {
    private final SeatLockService lockService;
    private final PricingStrategy pricingStrategy;
    private final PaymentService paymentService;
    private final BookingRepository bookingRepo;

    public Booking initiateBooking(String showId, List<String> seatIds, String userId) {
        boolean locked = lockService.lockSeats(showId, seatIds, userId);
        if (!locked) throw new SeatsUnavailableException("One or more seats already locked");

        Show show = showRepo.findById(showId);
        List<Seat> seats = show.getSeats(seatIds);
        double amount = pricingStrategy.calculatePrice(show, seats);

        Booking booking = new Booking(UUID.randomUUID().toString(),
            show, userRepo.findById(userId), seats, amount, BookingStatus.PENDING);
        return bookingRepo.save(booking);
    }

    public Booking confirmBooking(String bookingId, PaymentRequest paymentReq) {
        Booking booking = bookingRepo.findById(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING)
            throw new InvalidBookingStateException("Booking is not pending");

        // Verify locks are still valid (not expired)
        String showId = booking.getShow().getId();
        List<String> seatIds = booking.getSeatIds();
        if (!lockService.areLocksValid(showId, seatIds, booking.getUserId()))
            throw new SeatLockExpiredException("Seat locks have expired — please re-select");

        Payment payment = paymentService.charge(paymentReq, booking.getTotalAmount());
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            lockService.releaseLocks(showId, seatIds);
            booking.setStatus(BookingStatus.PAYMENT_FAILED);
            return bookingRepo.save(booking);
        }

        // Mark seats as permanently booked
        booking.getSeats().forEach(seat -> seat.setStatus(SeatStatus.BOOKED));
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaymentId(payment.getId());
        lockService.releaseLocks(showId, seatIds); // remove temp lock (seat is now BOOKED)
        return bookingRepo.save(booking);
    }

    public void cancelBooking(String bookingId) {
        Booking booking = bookingRepo.findById(bookingId);
        if (booking.getStatus() != BookingStatus.CONFIRMED)
            throw new InvalidBookingStateException("Only confirmed bookings can be cancelled");
        booking.getSeats().forEach(seat -> seat.setStatus(SeatStatus.AVAILABLE));
        booking.setStatus(BookingStatus.CANCELLED);
        paymentService.refund(booking.getPaymentId());
        bookingRepo.save(booking);
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Per-show lock instead of global lock:</strong> A single global lock serializes all seat
          bookings across all shows. A per-show ReentrantLock limits contention to users booking the same
          show — unrelated shows run concurrently.
        </li>
        <li>
          <strong>Expiry check inside the lock:</strong> Checking lock expiry outside the lock creates a
          TOCTOU race — another thread can steal the seat between the check and the actual locking. Both
          operations happen inside the same lock acquisition.
        </li>
        <li>
          <strong>Booking state machine (PENDING → CONFIRMED / CANCELLED):</strong> Separating booking
          creation from payment confirmation means a failed payment has a clean state to transition to, and
          re-attempts are explicit rather than implicit.
        </li>
        <li>
          <strong>SeatLock entity vs boolean flag:</strong> A dedicated SeatLock with userId and expiresAt
          lets you answer "is this lock mine?" and "has it expired?" in O(1) without a background thread
          scanning for expired locks.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you auto-expire seat locks after 10 minutes?"</strong> — Each SeatLock stores
          expiresAt. The isExpired() method checks LocalDateTime.now() against expiresAt. No background
          thread needed — expiry is lazy (checked on next access). Optionally, use a scheduled executor
          to clean up stale entries from the map.
        </li>
        <li>
          <strong>"How do you scale this to handle 100,000 concurrent bookings for a blockbuster?"</strong>
          — Shard shows across application servers. Each show is owned by one shard (consistent hashing on
          showId). The per-show lock remains local. Use Redis SETNX with a TTL as the distributed seat lock
          if you need multi-node safety.
        </li>
        <li>
          <strong>"How do you display a live seat map?"</strong> — Serve seat status from a Redis sorted set
          or an in-memory cache. On seat selection, update Redis atomically (SETNX with TTL). WebSocket
          pushes seat status changes to all users viewing the same show.
        </li>
      </ul>

      <h2>FAQ — Movie Ticket Booking Low Level Design</h2>

      <h3>What design patterns are used in BookMyShow LLD?</h3>
      <p>
        The primary patterns are <strong>Strategy</strong> (CategoryPricing vs SurgePricing),
        <strong>State Machine</strong> (booking lifecycle: PENDING → CONFIRMED → CANCELLED), and
        <strong>Repository</strong> (BookingRepository, ShowRepository). The seat locking mechanism uses
        a per-entity lock pattern inspired by fine-grained locking.
      </p>

      <h3>How do you prevent double booking in a movie ticket system?</h3>
      <p>
        Use a per-show ReentrantLock. Before marking any seat as locked, acquire the show-level lock,
        verify all selected seats are free (not locked or booked), then lock them atomically. Release the
        Java lock immediately after — the SeatLock entity holds the logical reservation for 10 minutes.
        At the DB layer, add a unique constraint on (showId, seatId, status=BOOKED) as a safety net.
      </p>

      <h3>What is the difference between a seat lock and a booking?</h3>
      <p>
        A seat lock is a temporary reservation (10 minutes) created when a user selects seats but before
        payment. A booking is a permanent record created the moment the user initiates checkout. The booking
        starts in PENDING state. After successful payment, both the booking status and seat status are
        updated to CONFIRMED/BOOKED in the same transaction.
      </p>

      <h3>How do you model dynamic pricing for peak shows?</h3>
      <p>
        Implement SurgePricing as a Strategy that delegates to CategoryPricing for the base price, then
        applies a multiplier based on the show's current occupancy rate. The occupancy rate is a cheap
        derived value: (totalSeats - availableSeats) / totalSeats. No separate price table per time window
        is needed.
      </p>
    </>
  );
}
