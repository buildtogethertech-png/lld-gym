export default function Content() {
  return (
    <>
      <p>Designing a movie ticket booking system like BookMyShow is one of the most popular LLD interview problems at Swiggy, Razorpay, Paytm, and other product companies. The key challenge is handling concurrent seat booking — preventing two users from booking the same seat simultaneously. This guide walks through the full design.</p>

      <h2>Core Requirements</h2>
      <ul>
        <li>Browse movies, theaters, and showtimes</li>
        <li>View seat layout with real-time availability</li>
        <li>Select and book seats — prevent double booking</li>
        <li>Apply coupons and calculate final price</li>
        <li>Generate booking confirmation and ticket</li>
        <li>Cancellation with refund policy</li>
      </ul>

      <h2>Core Entities</h2>
      <ul>
        <li><strong>Movie</strong> — title, genre, duration, language</li>
        <li><strong>Theater</strong> — name, location, screens</li>
        <li><strong>Screen</strong> — has a seat layout, belongs to a theater</li>
        <li><strong>Show</strong> — a specific Movie playing on a Screen at a time</li>
        <li><strong>Seat</strong> — row, column, type (Regular/Premium/Recliner)</li>
        <li><strong>ShowSeat</strong> — seat state for a specific show (Available/Locked/Booked)</li>
        <li><strong>Booking</strong> — user, show, seats, payment, status</li>
        <li><strong>Payment</strong> — method, amount, transaction ID</li>
      </ul>

      <h2>The Concurrency Problem — Most Important Part</h2>
      <p>Two users selecting the same seat simultaneously is the crux of this problem. The solution is temporary seat locking:</p>
      <pre>{`enum ShowSeatStatus { AVAILABLE, LOCKED, BOOKED }

class ShowSeat {
  seat: Seat;
  status: ShowSeatStatus;
  lockedBy: string | null;   // userId
  lockExpiry: Date | null;   // 10 minutes from lock time
}

class BookingService {
  lockSeats(showId: string, seatIds: string[], userId: string): boolean {
    // In a real system: SELECT FOR UPDATE or optimistic locking
    const seats = this.getAvailableSeats(showId, seatIds);
    if (seats.length !== seatIds.length) return false; // Some already taken
    seats.forEach(s => {
      s.status = ShowSeatStatus.LOCKED;
      s.lockedBy = userId;
      s.lockExpiry = new Date(Date.now() + 10 * 60 * 1000);
    });
    return true;
  }
}`}</pre>

      <h2>Booking State Machine</h2>
      <pre>{`enum BookingStatus {
  INITIATED,   // Seats locked, payment pending
  CONFIRMED,   // Payment successful
  CANCELLED,   // User cancelled or lock expired
  EXPIRED      // Lock timed out before payment
}`}</pre>

      <h2>Pricing Strategy</h2>
      <pre>{`interface PricingStrategy { getPrice(seat: Seat, show: Show): number; }

class WeekendPricing implements PricingStrategy {
  getPrice(seat: Seat, show: Show): number {
    const base = seat.type === SeatType.PREMIUM ? 400 : 200;
    return base * 1.25; // 25% weekend surcharge
  }
}

class WeekdayPricing implements PricingStrategy {
  getPrice(seat: Seat, show: Show): number {
    return seat.type === SeatType.PREMIUM ? 350 : 180;
  }
}`}</pre>

      <h2>Cancellation Policy — Template Method</h2>
      <pre>{`abstract class CancellationPolicy {
  cancel(booking: Booking): number { // returns refund amount
    if (!this.canCancel(booking)) throw new Error("Cannot cancel");
    const refund = this.calculateRefund(booking);
    this.releaseSeats(booking);
    return refund;
  }
  abstract canCancel(booking: Booking): boolean;
  abstract calculateRefund(booking: Booking): number;
}

class Before24HourPolicy extends CancellationPolicy {
  canCancel(b: Booking) { return hoursUntilShow(b) > 24; }
  calculateRefund(b: Booking) { return b.totalAmount * 0.8; } // 20% fee
}`}</pre>

      <h2>Common Interview Questions</h2>
      <ul>
        <li>"How do you prevent double booking?" → Seat locking with expiry + SELECT FOR UPDATE in DB</li>
        <li>"What if the payment fails after locking?" → Lock expires, seats released back to available</li>
        <li>"How do you add dynamic pricing?" → Inject different PricingStrategy based on day/demand</li>
        <li>"How does the seat map work?" → Screen has a 2D grid of Seats; ShowSeat maps Show+Seat to status</li>
      </ul>

      <h2>Companies That Ask This</h2>
      <p>BookMyShow (obviously), Swiggy, Paytm, Razorpay, Cleartrip, MakeMyTrip, and most fintech/consumer companies in India. This is a top-5 most asked LLD problem.</p>
    </>
  );
}
