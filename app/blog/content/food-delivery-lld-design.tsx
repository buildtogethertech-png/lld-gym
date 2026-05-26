export default function Content() {
  return (
    <>
      <p>
        Food Delivery System (Swiggy / Zomato) is one of the most frequently asked Low Level Design
        problems in product-based company interviews. It covers restaurant browsing, order placement,
        real-time delivery partner assignment, and order tracking. Frequently asked at Swiggy, Zomato,
        Dunzo, and Flipkart, this guide covers the complete LLD with Java code, class diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Food Delivery LLD</h2>
      <p>
        This problem combines multiple design challenges in one. Interviewers want to see:
      </p>
      <ul>
        <li>Can you model the order lifecycle as a state machine (PLACED → CONFIRMED → DELIVERED)?</li>
        <li>Do you use Observer pattern to notify users of real-time order status updates?</li>
        <li>Can you design a delivery partner assignment strategy (nearest available, load-balanced)?</li>
        <li>Do you separate RestaurantService, OrderService, and DeliveryService cleanly (SRP)?</li>
        <li>Can you handle concurrent order placement without overselling menu items?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Users can browse restaurants by city, cuisine, and rating</li>
        <li>Users can view a restaurant menu and add items to cart</li>
        <li>Users can place an order — triggers restaurant confirmation and delivery assignment</li>
        <li>Order lifecycle: PLACED → ACCEPTED → PREPARING → PICKED_UP → DELIVERED</li>
        <li>Real-time order tracking — user sees delivery partner location</li>
        <li>Delivery partner assignment — nearest available partner gets the order</li>
        <li>Users can rate the restaurant and delivery partner post-delivery</li>
        <li>Support promo codes and discounts</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Order status updates must reach the user within 2 seconds</li>
        <li>Delivery assignment must complete in under 5 seconds</li>
        <li>System must handle 10,000 concurrent orders during peak hours</li>
        <li>Restaurant menu updates (price, availability) must propagate without restart</li>
      </ul>

      <h2>Core Entities — Food Delivery LLD Class Design</h2>
      <ul>
        <li><strong>User</strong> — id, name, email, savedAddresses</li>
        <li><strong>Restaurant</strong> — id, name, city, cuisine, rating, menu</li>
        <li><strong>MenuItem</strong> — id, name, price, category, isAvailable</li>
        <li><strong>Cart</strong> — userId, restaurantId, list of CartItems</li>
        <li><strong>Order</strong> — id, user, restaurant, items, deliveryAddress, status, totalAmount</li>
        <li><strong>DeliveryPartner</strong> — id, name, currentLocation, status (AVAILABLE/ON_TRIP)</li>
        <li><strong>Delivery</strong> — id, orderId, partner, pickupTime, deliveryTime, status</li>
        <li><strong>AssignmentStrategy</strong> — interface; NearestPartnerStrategy implements it</li>
        <li><strong>NotificationService</strong> — Observer-based; pushes status updates to users</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`User
+-- id, name, email
+-- savedAddresses: List<Address>

Restaurant
+-- id, name, city, cuisine
+-- rating: double, menu: List<MenuItem>
+-- isOpen: boolean

MenuItem
+-- id, name, price: double
+-- category: String, isAvailable: boolean

Order
+-- id, user: User, restaurant: Restaurant
+-- items: List<OrderItem>
+-- deliveryAddress: Address
+-- status: OrderStatus
+-- totalAmount: double
+-- promoCode: String (nullable)

DeliveryPartner
+-- id, name, phone
+-- location: GeoPoint
+-- status: PartnerStatus (AVAILABLE/ON_TRIP)

Delivery
+-- id, orderId: String
+-- partner: DeliveryPartner
+-- pickupTime, deliveryTime: LocalDateTime
+-- status: DeliveryStatus

AssignmentStrategy (interface)
+-- assign(order, partners): DeliveryPartner

NearestPartnerStrategy implements AssignmentStrategy`}</pre>

      <h2>Order State Machine — Java</h2>
      <pre>{`public enum OrderStatus {
    PLACED, ACCEPTED, PREPARING, PICKED_UP, DELIVERED, CANCELLED
}

public class OrderStateMachine {
    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        VALID_TRANSITIONS.put(OrderStatus.PLACED,    Set.of(OrderStatus.ACCEPTED, OrderStatus.CANCELLED));
        VALID_TRANSITIONS.put(OrderStatus.ACCEPTED,  Set.of(OrderStatus.PREPARING, OrderStatus.CANCELLED));
        VALID_TRANSITIONS.put(OrderStatus.PREPARING, Set.of(OrderStatus.PICKED_UP));
        VALID_TRANSITIONS.put(OrderStatus.PICKED_UP, Set.of(OrderStatus.DELIVERED));
        VALID_TRANSITIONS.put(OrderStatus.DELIVERED, Set.of());
        VALID_TRANSITIONS.put(OrderStatus.CANCELLED, Set.of());
    }

    public static void transition(Order order, OrderStatus newStatus) {
        Set<OrderStatus> allowed = VALID_TRANSITIONS.get(order.getStatus());
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new InvalidOrderTransitionException(
                "Cannot transition from " + order.getStatus() + " to " + newStatus);
        }
        order.setStatus(newStatus);
    }
}`}</pre>

      <h2>Delivery Partner Assignment</h2>
      <pre>{`public interface AssignmentStrategy {
    DeliveryPartner assign(Order order, List<DeliveryPartner> availablePartners);
}

public class NearestPartnerStrategy implements AssignmentStrategy {
    @Override
    public DeliveryPartner assign(Order order, List<DeliveryPartner> availablePartners) {
        GeoPoint restaurantLocation = order.getRestaurant().getLocation();

        return availablePartners.stream()
            .filter(p -> p.getStatus() == PartnerStatus.AVAILABLE)
            .min(Comparator.comparingDouble(
                p -> haversineDistance(p.getLocation(), restaurantLocation)
            ))
            .orElseThrow(() -> new NoPartnerAvailableException("No delivery partners available"));
    }

    private double haversineDistance(GeoPoint a, GeoPoint b) {
        double R = 6371; // Earth radius km
        double dLat = Math.toRadians(b.getLat() - a.getLat());
        double dLon = Math.toRadians(b.getLon() - a.getLon());
        double x = Math.sin(dLat/2) * Math.sin(dLat/2)
                 + Math.cos(Math.toRadians(a.getLat())) * Math.cos(Math.toRadians(b.getLat()))
                 * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    }
}`}</pre>

      <h2>OrderService and Observer-Based Notifications</h2>
      <pre>{`public interface OrderStatusObserver {
    void onStatusChange(Order order, OrderStatus newStatus);
}

public class PushNotificationObserver implements OrderStatusObserver {
    private final PushService pushService;
    @Override
    public void onStatusChange(Order order, OrderStatus newStatus) {
        String msg = buildMessage(newStatus, order.getRestaurant().getName());
        pushService.send(order.getUser().getId(), msg);
    }
}

public class OrderService {
    private final OrderRepository orderRepo;
    private final DeliveryService deliveryService;
    private final List<OrderStatusObserver> observers = new ArrayList<>();

    public void addObserver(OrderStatusObserver observer) { observers.add(observer); }

    public Order placeOrder(OrderRequest req, String userId) {
        validateCart(req);
        Order order = new Order(UUID.randomUUID().toString(),
            userRepo.findById(userId), restaurantRepo.findById(req.getRestaurantId()),
            req.getItems(), req.getDeliveryAddress(), OrderStatus.PLACED,
            calculateTotal(req));
        orderRepo.save(order);
        notifyObservers(order, OrderStatus.PLACED);

        // Async: restaurant confirmation (webhook or polling)
        restaurantService.notifyRestaurant(order);
        return order;
    }

    public void updateStatus(String orderId, OrderStatus newStatus) {
        Order order = orderRepo.findById(orderId);
        OrderStateMachine.transition(order, newStatus);
        orderRepo.save(order);
        notifyObservers(order, newStatus);

        if (newStatus == OrderStatus.ACCEPTED) {
            deliveryService.assignPartner(order);
        }
    }

    private void notifyObservers(Order order, OrderStatus status) {
        observers.forEach(obs -> obs.onStatusChange(order, status));
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>State machine with explicit transition map:</strong> The VALID_TRANSITIONS map prevents
          invalid state changes (e.g., DELIVERED → PLACED) without a chain of if-else blocks. Adding a
          new state (e.g., RETURNED) requires only adding an entry to the map.
        </li>
        <li>
          <strong>Observer for status notifications:</strong> Multiple consumers need to react to order
          status changes — push notifications, email, analytics, delivery assignment. Observer decouples
          OrderService from each consumer. Adding an SMS observer is a new class only.
        </li>
        <li>
          <strong>Delivery assignment as a separate service:</strong> DeliveryService is only triggered
          on the ACCEPTED transition. If assignment fails (no partners available), the order stays in
          ACCEPTED state and retries — it does not pollute OrderService logic.
        </li>
        <li>
          <strong>Haversine for distance:</strong> Great-circle distance is the correct metric for
          partner assignment. Euclidean distance is wrong at city scale because it does not account for
          Earth curvature. Haversine adds 20 lines and is the industry standard.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you handle a restaurant rejecting an order?"</strong> — Restaurant sends a
          CANCELLED event. OrderService transitions to CANCELLED, triggers refund, and notifies the user.
          The transition map explicitly allows ACCEPTED → CANCELLED.
        </li>
        <li>
          <strong>"How do you implement promo codes?"</strong> — Add a PromoService with validatePromo
          (userId, code, orderAmount). Returns a DiscountResult with discount type (FLAT/PERCENT) and
          value. OrderService applies the discount before saving the total.
        </li>
        <li>
          <strong>"How do you track the delivery partner live?"</strong> — Partner app sends GPS pings
          every 5 seconds to a location service. The API returns the partner's current GeoPoint. The
          client polls or uses WebSocket to display live tracking.
        </li>
      </ul>

      <h2>FAQ — Food Delivery System Low Level Design</h2>

      <h3>What design patterns are used in Swiggy/Zomato LLD?</h3>
      <p>
        The primary patterns are <strong>Observer</strong> (order status notifications),
        <strong>Strategy</strong> (delivery partner assignment), <strong>State Machine</strong> (order
        lifecycle), and <strong>Factory</strong> (creating order objects from request DTOs).
      </p>

      <h3>How do you design delivery partner assignment in food delivery LLD?</h3>
      <p>
        The NearestPartnerStrategy filters all AVAILABLE partners, computes Haversine distance from the
        restaurant, and picks the closest one. Mark that partner as ON_TRIP atomically to prevent double
        assignment. For scale, maintain a geospatial index (Redis GEO or PostGIS) to find nearby partners
        in O(log n) instead of scanning all partners.
      </p>

      <h3>What is the order state machine in food delivery?</h3>
      <p>
        States: PLACED (user submitted) → ACCEPTED (restaurant confirmed) → PREPARING (kitchen cooking)
        → PICKED_UP (partner collected) → DELIVERED. Cancellation is allowed from PLACED and ACCEPTED.
        Any invalid transition (e.g., PREPARING → PLACED) throws an exception.
      </p>

      <h3>How do you handle concurrent orders from the same restaurant?</h3>
      <p>
        Add a capacity check in OrderService — each restaurant has a maxConcurrentOrders setting. Use an
        atomic counter per restaurant. If the counter exceeds capacity, reject with a service unavailable
        response. Reset the counter when an order moves to PICKED_UP or CANCELLED.
      </p>
    </>
  );
}
