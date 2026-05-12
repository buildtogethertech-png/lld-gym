export default function Content() {
  return (
    <>
      <p>
        Low Level Design (LLD) rounds are now a standard part of software engineering interviews at Amazon, Google,
        Flipkart, Swiggy, Uber, and virtually every product company. Yet most engineers have no idea what to practice.
        This guide cuts through the noise — here are the best LLD problems to prepare, grouped by difficulty, with
        the key OOP concepts each one tests.
      </p>

      <h2>What Is an LLD Interview Round?</h2>
      <p>
        In an LLD round (also called Object-Oriented Design or System Design — Low Level), you're given a real-world
        system and 45–60 minutes to design its classes, relationships, and core algorithms. Unlike High Level Design
        (HLD) which covers distributed architecture, LLD is about code structure — class diagrams, design patterns,
        SOLID principles, and interfaces.
      </p>
      <p>
        Interviewers evaluate you on: can you identify the right entities without over-engineering? Do you apply
        the Single Responsibility Principle? Can you use patterns like Strategy, Observer, or Factory to make the
        design extensible? Do you write clean, compilable code under time pressure?
      </p>

      <h2>Beginner LLD Problems (Start Here)</h2>
      <p>
        If you're new to LLD interviews, start with these. They test fundamental OOP concepts without complex
        concurrency or algorithmic twists.
      </p>

      <h3>1. Parking Lot System</h3>
      <p>
        The most classic LLD problem. You need to model floors, slots, vehicles, tickets, and a pricing engine.
        It tests the <strong>Strategy pattern</strong> (different pricing per vehicle type), enums, and clean
        entity separation. Almost every company asks this in some form.
        <a href="/problem/parking-lot">Practice the Parking Lot problem on LLD Hub →</a>
      </p>
      <p>Key classes: <code>ParkingLot</code>, <code>Floor</code>, <code>Slot</code>, <code>Vehicle</code>,
      <code>Ticket</code>, <code>PricingStrategy</code>.</p>

      <h3>2. Library Management System</h3>
      <p>
        Books, members, borrowing records, fines — a clean domain with clear entity boundaries. Tests your ability
        to model relationships (a member can borrow many books; a book has many copies) and implement search.
        <a href="/problem/library-management">Practice Library Management →</a>
      </p>

      <h3>3. ATM Machine</h3>
      <p>
        The ATM problem is deceptively rich. It tests the <strong>State pattern</strong> (Idle → Card Inserted →
        PIN Verified → Transaction → Dispensing Cash → Ejecting Card), cash dispensing via the
        <strong>Chain of Responsibility pattern</strong>, and interface design for bank integrations.
        <a href="/problem/atm-machine">Practice ATM Machine →</a>
      </p>
      <pre>{`// State pattern for ATM
interface ATMState {
  insertCard(atm: ATM): void;
  enterPIN(atm: ATM, pin: String): void;
  selectTransaction(atm: ATM, type: TransactionType): void;
  dispatchCash(atm: ATM, amount: double): void;
  ejectCard(atm: ATM): void;
}

class IdleState implements ATMState {
  insertCard(atm: ATM) {
    System.out.println("Card inserted");
    atm.setState(new CardInsertedState());
  }
  enterPIN(atm: ATM, pin: String) {
    System.out.println("Insert card first");
  }
  // other methods throw/print "invalid operation"
}`}</pre>

      <h3>4. Elevator System</h3>
      <p>
        Design lifts for a building — multiple elevators, floors, and a scheduling algorithm (nearest car or SCAN
        algorithm). Tests state machines and algorithms.
        <a href="/problem/elevator-system">Practice Elevator System →</a>
      </p>

      <h3>5. URL Shortener</h3>
      <p>
        A URL shortener like bit.ly requires a hash function, redirect logic, expiry management, and analytics.
        Great for practising clean repository patterns and interface design.
        <a href="/problem/url-shortener">Practice URL Shortener →</a>
      </p>

      <h2>Intermediate LLD Problems (Most Frequently Asked)</h2>
      <p>
        These are the bread-and-butter of LLD interviews at Flipkart, Swiggy, Paytm, PhonePe, and similar companies.
        Expect at least one of these in your next interview.
      </p>

      <h3>6. Splitwise / Expense Splitter</h3>
      <p>
        Splitwise is one of the most intellectually demanding LLD problems. You need the
        <strong>Strategy pattern</strong> for split types (equal, exact, percentage), a balance tracking system,
        and a graph minimization algorithm to simplify debts. Asked frequently at fintech companies.
        <a href="/problem/expense-splitter">Practice Expense Splitter →</a>
      </p>
      <pre>{`// Strategy pattern for split types
interface SplitStrategy {
  Map<String, Double> calculateShares(double amount, List<Participant> participants);
}

class EqualSplit implements SplitStrategy {
  public Map<String, Double> calculateShares(double amount, List<Participant> p) {
    double share = amount / p.size();
    Map<String, Double> shares = new HashMap<>();
    p.forEach(participant -> shares.put(participant.getUserId(), share));
    return shares;
  }
}`}</pre>

      <h3>7. Food Delivery System (Swiggy/Zomato)</h3>
      <p>
        Restaurant menus, orders, delivery partner assignment, real-time tracking, and ratings. The
        <strong>Observer pattern</strong> is key for real-time status updates. This problem covers a lot of domain
        breadth — great for practising entity identification.
        <a href="/problem/food-delivery">Practice Food Delivery →</a>
      </p>

      <h3>8. Movie Ticket Booking (BookMyShow)</h3>
      <p>
        Theatres, shows, seats, bookings, payment, and concurrency control (two users booking the same seat simultaneously).
        One of the best problems for practising <strong>locking strategies</strong> and state transitions.
        <a href="/problem/movie-ticket-booking">Practice Movie Ticket Booking →</a>
      </p>

      <h3>9. LRU Cache</h3>
      <p>
        Implement a Least Recently Used cache with O(1) get and put operations. The classic solution uses a
        <strong>HashMap + Doubly Linked List</strong>. This is as much an algorithm problem as a design problem —
        often asked in SDE-2 interviews to test both skills together.
        <a href="/problem/lru-cache">Practice LRU Cache →</a>
      </p>
      <pre>{`class LRUCache {
  private int capacity;
  private Map<Integer, Node> map = new HashMap<>();
  private Node head = new Node(0, 0); // dummy head
  private Node tail = new Node(0, 0); // dummy tail

  LRUCache(int capacity) {
    this.capacity = capacity;
    head.next = tail;
    tail.prev = head;
  }

  int get(int key) {
    if (!map.containsKey(key)) return -1;
    Node node = map.get(key);
    moveToFront(node);
    return node.val;
  }

  void put(int key, int val) {
    if (map.containsKey(key)) {
      Node node = map.get(key);
      node.val = val;
      moveToFront(node);
    } else {
      if (map.size() == capacity) evictLRU();
      Node node = new Node(key, val);
      map.put(key, node);
      addToFront(node);
    }
  }
}`}</pre>

      <h3>10. Chat Application (WhatsApp)</h3>
      <p>
        Users, messages, chats (one-to-one and groups), delivery receipts, and online status. The
        <strong>Observer pattern</strong> handles message delivery notifications. Tests modelling of polymorphic
        entities (chat types).
        <a href="/problem/chat-application">Practice Chat Application →</a>
      </p>

      <h3>11. Notification System</h3>
      <p>
        Multi-channel notifications (email, SMS, push, in-app). This is a textbook use case for the
        <strong>Strategy pattern</strong> (per channel) and the <strong>Observer pattern</strong> (event-driven
        dispatch). Also a common backend engineering problem.
        <a href="/problem/notification-system">Practice Notification System →</a>
      </p>

      <h3>12. Ride Sharing (Uber/Ola)</h3>
      <p>
        Driver and rider matching, fare calculation, trip state machine, surge pricing, and ratings. One of the
        most comprehensive intermediate problems — touches multiple design patterns and a geo-matching algorithm.
        <a href="/problem/ride-sharing">Practice Ride Sharing →</a>
      </p>

      <h3>13. Rate Limiter</h3>
      <p>
        Implement a rate limiter supporting multiple algorithms — Token Bucket, Sliding Window Log, Fixed Window
        Counter. Frequently asked at API infrastructure and platform teams. Tests clean abstraction and
        thread safety.
        <a href="/problem/rate-limiter">Practice Rate Limiter →</a>
      </p>

      <h2>Advanced LLD Problems (SDE-2 and Above)</h2>
      <p>
        These require deeper design thinking, more entities, or non-trivial algorithms. If you're targeting
        SDE-2/SDE-3 roles at top-tier companies, practise all of these.
      </p>

      <h3>14. Hotel Booking System (OYO)</h3>
      <p>
        Rooms, availability calendars, bookings, pricing by season, and cancellation policies. The complexity lies
        in overlapping reservation detection and dynamic pricing.
        <a href="/problem/hotel-booking">Practice Hotel Booking →</a>
      </p>

      <h3>15. Payment Gateway</h3>
      <p>
        Orders, payment methods (card, UPI, wallet), retry logic, refunds, and webhooks. Tests idempotency design,
        state machines for payment status, and integration patterns with external PSPs.
        <a href="/problem/payment-gateway">Practice Payment Gateway →</a>
      </p>

      <h3>16. Distributed Job Scheduler</h3>
      <p>
        Schedule recurring and one-time tasks, with retries, priority queues, worker pools, and at-least-once
        delivery guarantees. Bridges LLD and HLD — interviewers often use this to pivot into distributed systems.
        <a href="/problem/job-scheduler">Practice Job Scheduler →</a>
      </p>

      <h3>17. Event Ticketing System (Ticketmaster)</h3>
      <p>
        Events, venues, seat maps, booking with seat holds (PENDING state during checkout), and concurrent access
        control. The seat hold pattern is a classic concurrency interview topic.
        <a href="/problem/event-ticketing">Practice Event Ticketing →</a>
      </p>

      <h3>18. Logging Framework</h3>
      <p>
        Design a production logging framework with multiple log levels, formatters, and appenders (file, console,
        remote). The <strong>Chain of Responsibility</strong> pattern handles log level filtering;
        <strong>Strategy</strong> handles formatting. This is asked to test framework design thinking.
        <a href="/problem/logger-framework">Practice Logger Framework →</a>
      </p>

      <h3>19. Inventory Management</h3>
      <p>
        Products, warehouses, stock levels, restocking triggers, and order fulfillment. Tests domain modelling
        for supply chain with the Observer pattern for low-stock alerts.
        <a href="/problem/inventory-management">Practice Inventory Management →</a>
      </p>

      <h3>20. Social Media Feed (Twitter/Instagram)</h3>
      <p>
        Users, posts, follows, likes, comments, and a feed generation algorithm (pull vs. push model). One of
        the few LLD problems that naturally bridges into HLD — great for SDE-3 discussions.
        <a href="/problem/social-media-feed">Practice Social Media Feed →</a>
      </p>

      <h2>How to Approach Any LLD Problem in an Interview</h2>
      <p>
        Follow this 5-step framework — it works for every problem on this list:
      </p>
      <ol>
        <li>
          <strong>Clarify requirements (3–5 min):</strong> Ask about scale, features in scope vs. out of scope,
          and edge cases. "Should the parking lot support EV charging slots?" shows depth.
        </li>
        <li>
          <strong>Identify core entities (3 min):</strong> List the nouns from requirements. These become your
          classes. Avoid anemic models — give each entity behaviour, not just fields.
        </li>
        <li>
          <strong>Define relationships (2 min):</strong> Has-a vs. Is-a. Prefer composition over inheritance.
          Draw a quick UML in your mind or on the whiteboard.
        </li>
        <li>
          <strong>Apply design patterns (5 min):</strong> Identify which patterns solve the extensibility
          problems. Strategy for algorithm variants, Observer for event notifications, State for state machines.
        </li>
        <li>
          <strong>Write code (25–30 min):</strong> Start with interfaces and key classes. Write real, compilable
          code — not pseudocode. Interviewers penalise pseudocode in LLD rounds.
        </li>
      </ol>

      <h2>Most Common Design Patterns Across These Problems</h2>
      <p>
        If you understand these four patterns deeply, you can handle 80% of LLD interviews:
      </p>
      <ul>
        <li>
          <strong>Strategy Pattern</strong> — used in Parking Lot (pricing), Expense Splitter (split types),
          Rate Limiter (algorithms), Logger (formatters). Whenever behaviour varies by type, use Strategy.
        </li>
        <li>
          <strong>Observer Pattern</strong> — used in Notification System, Chat App, Food Delivery tracking.
          Whenever one event should trigger many listeners, use Observer.
        </li>
        <li>
          <strong>State Pattern</strong> — used in ATM, Elevator, Movie Ticket Booking, Payment Gateway.
          Whenever an entity has distinct phases with different allowed actions, use State.
        </li>
        <li>
          <strong>Factory Pattern</strong> — used in Notification System (channel factory), Logger (appender
          factory). Whenever creation logic is complex or type-dependent, use Factory.
        </li>
      </ul>
      <p>
        For a deep dive into patterns with LLD examples, read our{" "}
        <a href="/blog/design-patterns-lld-interview">Design Patterns for LLD Interviews guide</a>.
      </p>

      <h2>SOLID Principles Checklist for LLD Reviews</h2>
      <p>
        Before you call your design done in an interview, run through this mental checklist:
      </p>
      <ul>
        <li><strong>S — SRP:</strong> Does each class have exactly one reason to change?</li>
        <li><strong>O — OCP:</strong> Can you add a new vehicle type or split strategy without modifying existing classes?</li>
        <li><strong>L — LSP:</strong> Do your subtypes behave correctly when substituted for the base type?</li>
        <li><strong>I — ISP:</strong> Are interfaces lean? Would any implementor leave a method empty?</li>
        <li><strong>D — DIP:</strong> Do high-level classes depend on interfaces, not concrete implementations?</li>
      </ul>
      <p>
        For the full guide, read <a href="/blog/solid-principles-lld-interview">SOLID Principles for LLD Interviews</a>.
      </p>

      <h2>Which Problems Are Asked at Which Companies?</h2>
      <p>
        Based on interview reports and community feedback:
      </p>
      <ul>
        <li><strong>Amazon:</strong> Parking Lot, Library Management, Notification System, LRU Cache</li>
        <li><strong>Flipkart / Meesho:</strong> Splitwise, Food Delivery, Inventory Management, Payment Gateway</li>
        <li><strong>Swiggy / Zomato:</strong> Ride Sharing, Food Delivery, Job Scheduler</li>
        <li><strong>Paytm / PhonePe:</strong> Payment Gateway, ATM Machine, Rate Limiter</li>
        <li><strong>Uber / Ola:</strong> Ride Sharing, Elevator System, Rate Limiter</li>
        <li><strong>Razorpay / CRED:</strong> Payment Gateway, Expense Splitter, Rate Limiter</li>
        <li><strong>Google / Microsoft:</strong> LRU Cache, Logger Framework, Chat Application</li>
      </ul>

      <h2>Frequently Asked Questions (FAQ)</h2>

      <h3>What is Low Level Design in interviews?</h3>
      <p>
        Low Level Design (LLD) is a type of interview round where you design classes, interfaces, and relationships
        for a given system — focusing on Object-Oriented Design, SOLID principles, and design patterns. It differs
        from High Level Design (HLD) which focuses on distributed architecture, databases, and infrastructure.
      </p>

      <h3>Which LLD problem should I start with?</h3>
      <p>
        Start with the Parking Lot system. It's beginner-friendly, covers the Strategy pattern, enums, and clean
        entity separation — and is asked at almost every company. Once comfortable, move to ATM Machine (State
        pattern) and then Splitwise (multi-pattern + algorithm).
      </p>

      <h3>How many LLD problems should I practise before an interview?</h3>
      <p>
        Quality over quantity. Practise 10–12 problems deeply — understand the design decisions, can explain the
        why behind every pattern you use, and can write clean code. Skimming 25 problems without depth won't help.
        Use AI-scored feedback on LLD Hub to identify weak spots in your solutions.
      </p>

      <h3>Do I write code in an LLD interview or just draw diagrams?</h3>
      <p>
        At most product companies (Amazon, Flipkart, Swiggy, etc.), you are expected to write actual compilable
        code — typically in Java or Python. A class diagram alone is not enough. You should write interfaces,
        key method implementations, and any non-trivial algorithms.
      </p>

      <h3>What language should I use for LLD interviews?</h3>
      <p>
        Java is the most common choice because its strict typing makes class hierarchies explicit. Python is
        accepted at most companies. Use whatever language you're most comfortable writing clean OOP code in.
        Avoid switching languages for interviews.
      </p>

      <h3>What is the difference between LLD and HLD?</h3>
      <p>
        <strong>LLD (Low Level Design)</strong> focuses on class diagrams, OOP, SOLID principles, and design
        patterns — code-level design. <strong>HLD (High Level Design)</strong> focuses on system components,
        databases, caching, load balancing, and distributed architecture. Senior roles (SDE-2+) are expected
        to handle both.
      </p>

      <h2>Where to Practice LLD Problems</h2>
      <p>
        LLD Hub offers all 20 problems above with AI-scored feedback. Submit your solution in the browser editor
        and get a score across 5 dimensions: OOP design, SOLID principles, design patterns, code quality, and
        completeness — the same dimensions real interviewers evaluate. It's the fastest way to identify gaps
        in your design thinking.
      </p>
      <p>
        Start with the free problems, then unlock the full set once you're comfortable with the basics.
        Consistent deliberate practice on these 20 problems is all you need to pass LLD rounds at any
        product company.
      </p>
    </>
  );
}
