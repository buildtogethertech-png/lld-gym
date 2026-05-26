export default function Content() {
  return (
    <>
      <p>
        Event Ticketing System (Ticketmaster / BookMyShow) is an advanced Low Level Design problem asked in
        senior SDE interviews. It covers high-concurrency seat holds, waiting lists, dynamic pricing, and
        overselling prevention. This guide covers the complete Event Ticketing LLD with Java code, class
        diagram, and interview FAQ.
      </p>

      <h2>Why Interviewers Ask Event Ticketing LLD</h2>
      <p>
        Event ticketing is a more complex version of the movie booking problem with additional challenges.
        Interviewers want to see:
      </p>
      <ul>
        <li>Can you handle a ticket rush — 50,000 users competing for 5,000 tickets in 1 second?</li>
        <li>Do you implement a waiting list with fair position-based assignment?</li>
        <li>Can you design dynamic pricing that responds to demand in real time?</li>
        <li>Do you prevent overselling with atomic CAS operations or database transactions?</li>
        <li>Can you model Venue, Zone, Seat, Ticket, and Order as distinct entities?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Events have a venue with multiple zones (Floor, Balcony, VIP) each with different prices</li>
        <li>Users browse events and select tickets — system holds tickets for 15 minutes</li>
        <li>User completes payment — tickets are permanently reserved</li>
        <li>When event is sold out, users can join a waiting list</li>
        <li>If a ticket hold expires, the next person on the waiting list is offered the ticket</li>
        <li>Support early bird, regular, and last-minute pricing tiers</li>
        <li>Users can transfer or resell tickets (secondary market)</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>No more tickets sold than the venue capacity under any concurrency</li>
        <li>Ticket hold must auto-expire after 15 minutes</li>
        <li>Waiting list notifications must be sent within 30 seconds of a cancellation</li>
        <li>System must handle 100,000 concurrent users for a blockbuster event release</li>
      </ul>

      <h2>Core Entities — Event Ticketing LLD Class Design</h2>
      <ul>
        <li><strong>Event</strong> — id, name, artist, date, venue, status (UPCOMING/ACTIVE/SOLD_OUT/PAST)</li>
        <li><strong>Venue</strong> — id, name, city, capacity, zones</li>
        <li><strong>Zone</strong> — id, name (FLOOR/BALCONY/VIP), totalSeats, availableSeats</li>
        <li><strong>Ticket</strong> — id, event, zone, seatNumber, status (AVAILABLE/HELD/SOLD/CANCELLED)</li>
        <li><strong>TicketHold</strong> — id, ticketId, userId, heldAt, expiresAt</li>
        <li><strong>Order</strong> — id, userId, tickets, totalAmount, status, paymentId</li>
        <li><strong>WaitingList</strong> — eventId, userId, position, zone, requestedAt</li>
        <li><strong>PricingStrategy</strong> — interface; EarlyBirdPricing, SurgePricing</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Event
+-- id, name, artist: String
+-- eventDate: LocalDateTime
+-- venue: Venue
+-- status: EventStatus (UPCOMING/ON_SALE/SOLD_OUT/COMPLETED)
+-- saleStartTime: LocalDateTime

Venue
+-- id, name, city: String
+-- zones: List<Zone>
+-- totalCapacity: int

Zone
+-- id, name: String
+-- basePrice: double
+-- totalSeats, availableSeats: int  (AtomicInteger for concurrency)
+-- soldSeats: int

Ticket
+-- id, seatNumber: String
+-- event: Event, zone: Zone
+-- status: TicketStatus (AVAILABLE/HELD/SOLD/CANCELLED)

TicketHold
+-- id, ticketId, userId: String
+-- heldAt, expiresAt: LocalDateTime
+-- isExpired(): boolean

Order
+-- id, userId: String
+-- tickets: List<Ticket>
+-- totalAmount: double
+-- status: OrderStatus (PENDING/CONFIRMED/CANCELLED)

WaitingListEntry
+-- eventId, userId: String
+-- zonePreference: String
+-- position: int
+-- requestedAt: LocalDateTime`}</pre>

      <h2>Atomic Ticket Holding — CAS-Based Concurrency</h2>
      <pre>{`public class TicketHoldService {
    private static final int HOLD_MINUTES = 15;

    // zone-level atomic counter — no synchronized needed
    // AtomicInteger per zone for available seats
    private final ConcurrentHashMap<String, AtomicInteger> zoneAvailability = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, TicketHold> activeHolds = new ConcurrentHashMap<>(); // ticketId -> hold

    public List<TicketHold> holdTickets(String eventId, String zoneId, int count, String userId) {
        AtomicInteger available = zoneAvailability.get(zoneId);
        if (available == null) throw new ZoneNotFoundException(zoneId);

        // CAS loop: atomically decrement available count
        while (true) {
            int current = available.get();
            if (current < count) throw new InsufficientTicketsException("Not enough tickets available");
            if (available.compareAndSet(current, current - count)) break; // atomic decrement
        }

        // Assign specific tickets and create holds
        List<Ticket> tickets = ticketRepo.findAvailableTickets(eventId, zoneId, count);
        List<TicketHold> holds = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusMinutes(HOLD_MINUTES);

        for (Ticket ticket : tickets) {
            ticket.setStatus(TicketStatus.HELD);
            ticketRepo.save(ticket);
            TicketHold hold = new TicketHold(UUID.randomUUID().toString(),
                ticket.getId(), userId, now, expiry);
            activeHolds.put(ticket.getId(), hold);
            holds.add(hold);
        }
        return holds;
    }

    public void releaseHolds(List<String> ticketIds, String userId) {
        for (String ticketId : ticketIds) {
            TicketHold hold = activeHolds.remove(ticketId);
            if (hold == null || !hold.getUserId().equals(userId)) continue;

            Ticket ticket = ticketRepo.findById(ticketId);
            ticket.setStatus(TicketStatus.AVAILABLE);
            ticketRepo.save(ticket);

            String zoneId = ticket.getZone().getId();
            zoneAvailability.get(zoneId).incrementAndGet();
        }
    }
}`}</pre>

      <h2>Waiting List with Observer Notification</h2>
      <pre>{`public class WaitingListService {
    private final ConcurrentHashMap<String, LinkedBlockingQueue<WaitingListEntry>> waitingLists
        = new ConcurrentHashMap<>(); // eventId -> queue (position-ordered)
    private final NotificationService notificationService;

    public int joinWaitingList(String eventId, String zoneId, String userId) {
        LinkedBlockingQueue<WaitingListEntry> queue =
            waitingLists.computeIfAbsent(eventId + ":" + zoneId, k -> new LinkedBlockingQueue<>());
        int position = queue.size() + 1;
        queue.add(new WaitingListEntry(eventId, userId, zoneId, position, LocalDateTime.now()));
        return position;
    }

    public void notifyNextInLine(String eventId, String zoneId, int ticketCount) {
        LinkedBlockingQueue<WaitingListEntry> queue = waitingLists.get(eventId + ":" + zoneId);
        if (queue == null || queue.isEmpty()) return;

        for (int i = 0; i < ticketCount; i++) {
            WaitingListEntry entry = queue.poll();
            if (entry == null) break;
            notificationService.sendTicketAvailable(entry.getUserId(), eventId, zoneId);
        }
    }
}

// Called when holds expire or tickets are cancelled
public class TicketExpiryHandler {
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final WaitingListService waitingListService;
    private final TicketHoldService holdService;

    public void scheduleExpiry(TicketHold hold) {
        long delayMs = ChronoUnit.MILLIS.between(LocalDateTime.now(), hold.getExpiresAt());
        scheduler.schedule(() -> {
            if (hold.isExpired()) {
                holdService.releaseHolds(List.of(hold.getTicketId()), hold.getUserId());
                waitingListService.notifyNextInLine(hold.getEventId(), hold.getZoneId(), 1);
            }
        }, delayMs, TimeUnit.MILLISECONDS);
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>AtomicInteger for available seat count:</strong> compareAndSet atomically decrements the
          available count only if it matches the current value. If another thread modified it concurrently,
          the CAS fails and the loop retries. This prevents overselling without a synchronized block on
          the entire seat selection flow.
        </li>
        <li>
          <strong>Hold at zone level, assign specific seats after hold:</strong> Decrement the zone's
          available count first (atomic), then assign specific ticket IDs. If specific seat assignment
          fails after the CAS, roll back the count. This separates the atomic availability claim from
          the seat selection — both can be optimized independently.
        </li>
        <li>
          <strong>LinkedBlockingQueue for waiting list:</strong> Maintains FIFO order for fair waiting
          list assignment. When a hold expires, poll from the front of the queue and notify that user.
          Position is computed as queue.size() at join time.
        </li>
        <li>
          <strong>Scheduled expiry per hold:</strong> ScheduledExecutorService fires exactly at expiry
          time — no polling loop. In production, use a distributed scheduler (Redis EXPIRE events or
          DynamoDB TTL) for multi-node consistency.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you handle a flash sale with 100K users hitting at the same second?"</strong>
          — Use a request queue (SQS FIFO) to serialize ticket requests. Workers process one request at
          a time per zone. Users who do not get a ticket are automatically added to the waiting list.
          This prevents CAS contention and gives a fair first-come-first-served result.
        </li>
        <li>
          <strong>"How do you implement ticket resale (secondary market)?"</strong> — Ticket gets a
          resalePrice field and a resaleStatus (NOT_LISTED / LISTED / SOLD). A separate ResaleService
          lists and buys tickets. The platform takes a service fee on resale transactions.
        </li>
        <li>
          <strong>"How do you prevent bots from bulk-buying tickets?"</strong> — Rate-limit per
          userId: max 6 tickets per user per event. Require CAPTCHA on high-velocity endpoints. Detect
          velocity patterns (same IP, sequential requests) and flag accounts for review.
        </li>
      </ul>

      <h2>FAQ — Event Ticketing System Low Level Design</h2>

      <h3>What design patterns are used in Event Ticketing LLD?</h3>
      <p>
        The primary patterns are <strong>Strategy</strong> (PricingStrategy — EarlyBird, Surge),
        <strong>Observer</strong> (waiting list notification on ticket release), <strong>State Machine</strong>
        (ticket status: AVAILABLE → HELD → SOLD → CANCELLED), and CAS-based concurrency (AtomicInteger)
        for lock-free seat counting.
      </p>

      <h3>How do you prevent overselling tickets?</h3>
      <p>
        Use AtomicInteger.compareAndSet for the zone's available seat count. The CAS only succeeds if the
        current count matches the expected value — concurrent decrement attempts retry until they succeed
        or find insufficient seats. As a database-level safety net, add a CHECK constraint: availableSeats
        plus soldSeats must not exceed totalSeats.
      </p>

      <h3>How does the waiting list work in event ticketing?</h3>
      <p>
        Users join a FIFO queue per (event, zone). When a held ticket expires or is cancelled, poll the
        front of the queue and send that user a time-limited offer (e.g., 10 minutes to complete purchase).
        If they do not complete, poll the next user. This ensures fairness without reassigning tickets
        arbitrarily.
      </p>

      <h3>What is dynamic pricing in event ticketing?</h3>
      <p>
        SurgePricing strategy: if a zone's soldSeats exceed 80% of totalSeats, apply a 1.3x multiplier.
        If sold seats exceed 90%, apply 1.5x. EarlyBirdPricing: apply a 0.8x discount if the purchase
        is more than 30 days before the event. Both strategies implement the same PricingStrategy interface
        — the ticket service does not know which is active.
      </p>
    </>
  );
}
