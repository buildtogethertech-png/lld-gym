export default function Content() {
  return (
    <>
      <p>Designing a Hotel Booking System tests your ability to handle date-range availability, dynamic pricing, multiple room types, and cancellation policies — a great intermediate LLD problem frequently asked at OYO, MakeMyTrip, Cleartrip, and Expedia interviews.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Hotel</strong> — name, location, amenities, rating</li>
        <li><strong>Room</strong> — number, type, floor, base price</li>
        <li><strong>RoomType</strong> — Single, Double, Suite, Deluxe</li>
        <li><strong>Reservation</strong> — guest, room, checkIn, checkOut, status, price</li>
        <li><strong>Guest</strong> — profile, reservation history</li>
        <li><strong>PricingRule</strong> — defines price multipliers for dates/seasons</li>
      </ul>
      <h2>Availability Check</h2>
      <pre>{`class RoomRepository {
  findAvailable(hotelId: string, checkIn: Date, checkOut: Date, type: RoomType): Room[] {
    const allRooms = this.getRoomsByType(hotelId, type);
    const bookedRoomIds = this.reservationRepo.getBookedRoomIds(hotelId, checkIn, checkOut);
    return allRooms.filter(r => !bookedRoomIds.has(r.id));
  }
}`}</pre>
      <h2>Dynamic Pricing with Strategy</h2>
      <pre>{`interface PricingStrategy { getPrice(room: Room, checkIn: Date, checkOut: Date): number; }

class DynamicPricing implements PricingStrategy {
  getPrice(room: Room, checkIn: Date, checkOut: Date): number {
    let total = 0;
    for (let d = checkIn; d < checkOut; d.setDate(d.getDate() + 1)) {
      let dayPrice = room.basePrice;
      if (this.isWeekend(d))  dayPrice *= 1.25;
      if (this.isPeakSeason(d)) dayPrice *= 1.5;
      total += dayPrice;
    }
    return total;
  }
}`}</pre>
      <h2>Cancellation Policy with Template Method</h2>
      <pre>{`abstract class CancellationPolicy {
  cancel(reservation: Reservation): CancellationResult {
    const refund = this.calculateRefund(reservation);
    reservation.status = ReservationStatus.CANCELLED;
    this.paymentService.refund(reservation.paymentId, refund);
    return { refunded: refund };
  }
  abstract calculateRefund(res: Reservation): number;
}

class FreeCancellationPolicy extends CancellationPolicy {
  calculateRefund(res: Reservation) {
    const hoursToCheckIn = (res.checkIn.getTime() - Date.now()) / 3600000;
    return hoursToCheckIn > 24 ? res.totalPrice : res.totalPrice * 0.5;
  }
}`}</pre>
      <h2>Common Questions</h2>
      <ul>
        <li>"How do you prevent double booking?" → DB unique constraint on (roomId, date range overlap) + optimistic locking</li>
        <li>"How do you support early check-in?" → Add checkInTime field; pricing adjusts for partial day</li>
        <li>"How do you show room recommendations?" → Strategy for ranking (price, rating, availability)</li>
      </ul>
    </>
  );
}
