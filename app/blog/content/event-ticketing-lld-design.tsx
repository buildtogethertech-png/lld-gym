export default function Content() {
  return (
    <>
      <p>The Event Ticketing System (like Ticketmaster) is an advanced LLD problem that combines high concurrency handling, waiting lists, dynamic pricing, and complex state management. It's asked for senior SDE roles at companies handling high-traffic sales events.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Event</strong> — name, venue, date, ticket categories</li>
        <li><strong>Venue</strong> — sections, seat map</li>
        <li><strong>Ticket</strong> — category (GA/VIP/Seated), price, status</li>
        <li><strong>Order</strong> — user, tickets, status, payment</li>
        <li><strong>SeatHold</strong> — temporary reservation with 5-minute expiry</li>
        <li><strong>WaitingList</strong> — FIFO queue per event/category</li>
        <li><strong>PricingEngine</strong> — demand-based dynamic pricing</li>
      </ul>
      <h2>Seat Hold with Concurrency Control</h2>
      <pre>{`class TicketingService {
  holdTickets(eventId: string, category: string, qty: number, userId: string): SeatHold {
    // Optimistic locking: version field on TicketInventory
    const inventory = this.inventoryRepo.get(eventId, category);
    if (inventory.available < qty) throw new Error("Not enough tickets");

    const hold = new SeatHold(userId, eventId, category, qty, 5 * 60 * 1000);
    // Atomic decrement — DB handles concurrent access
    this.inventoryRepo.decrementAvailable(eventId, category, qty, inventory.version);
    this.holdRepo.save(hold);
    this.scheduleHoldExpiry(hold);
    return hold;
  }

  private scheduleHoldExpiry(hold: SeatHold) {
    setTimeout(() => {
      if (hold.status === HoldStatus.PENDING) {
        this.releaseHold(hold.id);
        this.notifyWaitingList(hold.eventId, hold.category, hold.qty);
      }
    }, hold.expiryMs);
  }
}`}</pre>
      <h2>Waiting List with Observer</h2>
      <pre>{`class WaitingListService {
  join(userId: string, eventId: string, category: string, qty: number): WaitingEntry {
    const entry = new WaitingEntry(userId, eventId, category, qty);
    this.queue.enqueue(eventId + category, entry);
    return entry;
  }

  notify(eventId: string, category: string, availableQty: number) {
    while (availableQty > 0) {
      const next = this.queue.peek(eventId + category);
      if (!next || next.qty > availableQty) break;
      this.notificationService.send(next.userId, "Tickets available! You have 10 minutes.");
      next.status = WaitingStatus.NOTIFIED;
      availableQty -= next.qty;
    }
  }
}`}</pre>
      <h2>Dynamic Pricing Strategy</h2>
      <pre>{`class DemandBasedPricing implements PricingStrategy {
  getPrice(basePrice: number, soldPct: number): number {
    if (soldPct < 0.5)  return basePrice;
    if (soldPct < 0.75) return basePrice * 1.2;
    if (soldPct < 0.9)  return basePrice * 1.5;
    return basePrice * 2.0; // High demand
  }
}`}</pre>
    </>
  );
}
