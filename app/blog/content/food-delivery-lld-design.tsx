export default function Content() {
  return (
    <>
      <p>Designing a food delivery system like Swiggy or Zomato is one of the most frequently asked LLD problems at Swiggy, Zomato, Dunzo, and other food-tech companies. It involves multiple interacting domains: restaurant catalog, order management, delivery assignment, and real-time tracking.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Customer</strong> — profile, saved addresses, payment methods</li>
        <li><strong>Restaurant</strong> — name, location, menu, operating hours</li>
        <li><strong>MenuItem</strong> — name, price, category, availability</li>
        <li><strong>Cart</strong> — belongs to a customer, contains CartItems</li>
        <li><strong>Order</strong> — created from Cart, has status lifecycle</li>
        <li><strong>DeliveryPartner</strong> — location, status, active order</li>
        <li><strong>Payment</strong> — method, status, transaction</li>
      </ul>
      <h2>Order State Machine</h2>
      <pre>{`enum OrderStatus {
  PLACED, ACCEPTED, PREPARING,
  READY_FOR_PICKUP, OUT_FOR_DELIVERY,
  DELIVERED, CANCELLED
}`}</pre>
      <h2>Observer for Real-time Tracking</h2>
      <pre>{`class Order {
  private observers: OrderObserver[] = [];
  addObserver(o: OrderObserver) { this.observers.push(o); }

  updateStatus(status: OrderStatus) {
    this.status = status;
    this.observers.forEach(o => o.onStatusChange(this, status));
  }
}
class CustomerApp implements OrderObserver {
  onStatusChange(order: Order, status: OrderStatus) {
    this.showNotification(\`Your order is \${status}\`);
  }
}`}</pre>
      <h2>Delivery Partner Assignment</h2>
      <pre>{`class DeliveryAssignmentService {
  assignPartner(order: Order): DeliveryPartner {
    const available = this.partnerRepo.findAvailableNear(order.restaurant.location, 5);
    if (!available.length) throw new Error("No partners available");
    return available.sort((a, b) =>
      distance(a.location, order.restaurant.location) -
      distance(b.location, order.restaurant.location)
    )[0];
  }
}`}</pre>
      <h2>Payment Strategy</h2>
      <pre>{`interface PaymentStrategy { pay(amount: number): PaymentResult; }
class UPIPayment    implements PaymentStrategy { ... }
class CardPayment   implements PaymentStrategy { ... }
class WalletPayment implements PaymentStrategy { ... }
class COD           implements PaymentStrategy { ... }`}</pre>
      <h2>Common Questions</h2>
      <ul>
        <li>"What if no delivery partner is available?" → Hold order, retry every 30s, or show estimated delay</li>
        <li>"How do you handle restaurant cancellation?" → Observer notifies customer, auto-refund triggered</li>
        <li>"How is distance calculated?" → Haversine formula for lat/lng; use external mapping API in production</li>
      </ul>
    </>
  );
}
