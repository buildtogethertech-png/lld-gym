import { Problem } from "./types";

export const PROBLEMS: Problem[] = [
  // Beginner L1-L4
  {
    id: "parking-lot",
    tags: ["lld","parking","state-machine","oop"],
    free: true,
    title: "Parking Lot System",
    difficulty: 2,
    description:
      "Design a parking lot system that can handle multiple floors, different vehicle types, and manage parking slots efficiently.",
    requirements: [
      "Support multiple vehicle types: Bike, Car, Truck",
      "Support multiple floors with configurable slot counts per floor",
      "Allocate nearest available slot to incoming vehicle",
      "Free up slot when vehicle exits",
      "Generate a ticket on entry and calculate fee on exit",
      "Support different pricing per vehicle type",
    ],
    constraints: [
      "A slot can only hold one vehicle at a time",
      "Bikes take small slots, Cars take medium, Trucks take large",
      "Pricing: Bike ₹20/hr, Car ₹40/hr, Truck ₹80/hr",
    ],
    hints: [
      "Think about: ParkingLot, Floor, Slot, Vehicle, Ticket entities",
      "Use Strategy pattern for pricing",
      "Consider how to find nearest available slot efficiently",
    ],
  },
  {
    id: "library-management",
    tags: ["lld","relationships","oop"],
    title: "Library Management System",
    difficulty: 1,
    description:
      "Design a library system where members can search, borrow, and return books. Librarians can manage inventory.",
    requirements: [
      "Members can search books by title, author, or ISBN",
      "Members can borrow and return books",
      "Track due dates and calculate fines for late returns",
      "Librarians can add, update, and remove books",
      "A member can borrow max 3 books at a time",
      "Send notification when a reserved book becomes available",
    ],
    constraints: [
      "Each book has multiple copies",
      "Fine: ₹5 per day after due date",
      "Borrow period: 14 days",
    ],
    hints: [
      "Think about: Library, Book, BookItem, Member, Librarian, Loan entities",
      "Use Observer pattern for notifications",
      "Separate BookCatalog from LoanService",
    ],
  },
  {
    id: "atm-machine",
    tags: ["lld","state-machine","encapsulation"],
    title: "ATM Machine",
    difficulty: 3,
    description:
      "Design an ATM system that handles card authentication, balance inquiry, cash withdrawal, and deposit operations.",
    requirements: [
      "Card insertion and PIN authentication (max 3 attempts)",
      "Check account balance",
      "Withdraw cash (check balance + dispense notes)",
      "Deposit cash",
      "Transfer funds between accounts",
      "Eject card and end session",
    ],
    constraints: [
      "After 3 wrong PIN attempts, block the card",
      "ATM has limited cash — track denomination counts",
      "Minimum withdrawal: ₹500, Maximum: ₹20,000",
    ],
    hints: [
      "Think about: ATM, Card, Account, Transaction, CashDispenser entities",
      "Use State pattern for ATM states (Idle, CardInserted, Authenticated)",
      "Chain of Responsibility for cash dispensing (₹500, ₹200, ₹100 notes)",
    ],
  },
  {
    id: "tic-tac-toe",
    tags: ["lld","oop","state-machine"],
    title: "Tic Tac Toe Game",
    difficulty: 1,
    description:
      "Design a Tic Tac Toe game supporting 2 players (human or AI) on an N×N board.",
    requirements: [
      "Support configurable board size (3x3, 4x4, etc.)",
      "Two players: can be Human or AI",
      "Track turns and switch between players",
      "Detect win conditions (row, column, diagonal)",
      "Detect draw condition",
      "Allow game reset",
    ],
    constraints: [
      "Board size N means N-in-a-row wins",
      "AI makes random valid moves (no need for minimax)",
    ],
    hints: [
      "Think about: Game, Board, Player, Move entities",
      "Use Strategy pattern for player types (Human vs AI)",
      "Separate win detection logic into its own class",
    ],
  },
  {
    id: "logger-system",
    tags: ["lld","srp","solid","patterns"],
    title: "Logger / Logging Framework",
    difficulty: 2,
    description:
      "Design a flexible logging framework that supports multiple log levels, formatters, and output destinations.",
    requirements: [
      "Support log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL",
      "Multiple output destinations: Console, File, Database",
      "Configurable log format (timestamp, level, message, context)",
      "Filter logs by minimum level",
      "Support multiple loggers with different configurations",
      "Thread-safe logging",
    ],
    constraints: [
      "Only one Logger instance per name (use registry)",
      "Log entries below configured level should be discarded",
    ],
    hints: [
      "Think about: Logger, LogLevel, Handler, Formatter, LogRecord entities",
      "Use Singleton for root logger",
      "Chain of Responsibility for handlers",
      "Observer/Publisher for log propagation",
    ],
  },

  // Intermediate L5-L8
  {
    id: "food-delivery",
    tags: ["lld","observer","factory","patterns"],
    title: "Food Delivery System (Swiggy/Zomato)",
    difficulty: 5,
    description:
      "Design a food delivery platform where customers can browse restaurants, place orders, and track delivery.",
    requirements: [
      "Customers browse restaurants and menus",
      "Add items to cart and place orders",
      "Assign delivery partner to order",
      "Real-time order status tracking",
      "Rating system for restaurants and delivery partners",
      "Support multiple payment methods",
    ],
    constraints: [
      "Order can only be placed if restaurant is open",
      "Delivery partner assigned based on proximity",
      "Order cancellation allowed only before restaurant accepts",
    ],
    hints: [
      "Think about: Customer, Restaurant, MenuItem, Order, DeliveryPartner, Payment",
      "Use Strategy for payment methods",
      "Use Observer for order status updates",
      "Use Factory for order creation",
    ],
  },
  {
    id: "chat-application",
    tags: ["lld","observer","patterns"],
    title: "Chat Application (WhatsApp-like)",
    difficulty: 5,
    description:
      "Design a messaging system supporting 1-on-1 chats, group chats, message status, and media sharing.",
    requirements: [
      "One-on-one messaging",
      "Group chats (create, add/remove members)",
      "Message status: Sent, Delivered, Read",
      "Send text, images, and documents",
      "Online/offline status",
      "Message history and search",
    ],
    constraints: [
      "Group can have max 256 members",
      "Media files max 100MB",
      "Messages stored for 30 days",
    ],
    hints: [
      "Think about: User, Chat, GroupChat, Message, MessageStatus entities",
      "Use Observer for real-time message delivery",
      "Use Composite for Chat (1-1 and Group share interface)",
      "Separate MessageStore from ChatService",
    ],
  },
  {
    id: "notification-system",
    tags: ["lld","observer","factory","patterns"],
    title: "Notification System",
    difficulty: 4,
    description:
      "Design a notification service that can send alerts via multiple channels based on user preferences and event types.",
    requirements: [
      "Support channels: Email, SMS, Push, In-App",
      "Users configure preferred channels per notification type",
      "Priority levels: Low, Medium, High, Critical",
      "Rate limiting per channel",
      "Retry failed notifications",
      "Notification history and read/unread tracking",
    ],
    constraints: [
      "Critical notifications bypass rate limits",
      "Max 100 emails/hour per user",
      "Retry max 3 times with exponential backoff",
    ],
    hints: [
      "Think about: Notification, Channel, UserPreference, NotificationService",
      "Use Strategy for each channel type",
      "Use Observer/Event bus to trigger notifications",
      "Use Template Method for notification formatting",
    ],
  },
  {
    id: "ride-sharing",
    tags: ["lld","factory","state-machine"],
    title: "Ride Sharing System (Uber/Ola)",
    difficulty: 6,
    description:
      "Design a ride sharing platform where riders request rides and drivers accept them.",
    requirements: [
      "Rider requests ride with pickup and drop location",
      "Match rider to nearest available driver",
      "Fare calculation based on distance and time",
      "Driver can accept or reject a ride",
      "Real-time trip tracking",
      "Rating system for both rider and driver",
      "Support ride types: Economy, Premium, XL",
    ],
    constraints: [
      "Driver matching timeout: 30 seconds",
      "Surge pricing during peak hours",
      "Minimum fare: ₹50",
    ],
    hints: [
      "Think about: Rider, Driver, Trip, Location, Fare, RideRequest",
      "Use Strategy for fare calculation (Economy vs Premium)",
      "Use Observer for trip status updates",
      "Use State pattern for driver states (Available, OnTrip, Offline)",
    ],
  },
  {
    id: "cache-system",
    tags: ["lld","singleton","patterns"],
    title: "LRU Cache System",
    difficulty: 4,
    description:
      "Design an in-memory cache system with LRU eviction policy, TTL support, and thread safety.",
    requirements: [
      "Get and Set operations with O(1) complexity",
      "LRU eviction when capacity is full",
      "TTL (time-to-live) per key",
      "Evict expired entries automatically",
      "Support cache statistics: hits, misses, evictions",
      "Thread-safe operations",
    ],
    constraints: [
      "Configurable max capacity",
      "TTL precision: seconds",
      "Zero TTL means no expiration",
    ],
    hints: [
      "Think about: Cache, CacheEntry, EvictionPolicy, CacheStats",
      "Use Doubly Linked List + HashMap for O(1) LRU",
      "Use Strategy for eviction policy (LRU, LFU, FIFO)",
      "Use Decorator to add TTL to base cache",
    ],
  },

  // Advanced L7-L10
  {
    id: "elevator-system",
    tags: ["lld","state-machine"],
    title: "Elevator System",
    difficulty: 7,
    description:
      "Design an elevator control system for a building with multiple elevators and floors.",
    requirements: [
      "Multiple elevators serving multiple floors",
      "Internal floor selection (inside elevator)",
      "External floor request (up/down buttons)",
      "Optimal elevator assignment algorithm",
      "Track elevator state: Moving Up, Moving Down, Idle",
      "Door open/close logic with safety timeout",
    ],
    constraints: [
      "Max capacity per elevator: 10 persons",
      "Doors stay open max 5 seconds",
      "Emergency stop button halts all elevators",
    ],
    hints: [
      "Think about: Building, Elevator, Floor, Request, ElevatorController",
      "Use State pattern for elevator states",
      "Use Strategy for elevator selection algorithm (SCAN, SSTF)",
      "Use Command pattern for floor requests",
    ],
  },
  {
    id: "payment-gateway",
    tags: ["lld","strategy","solid"],
    title: "Payment Gateway",
    difficulty: 8,
    description:
      "Design a payment processing system that handles transactions across multiple payment methods and providers.",
    requirements: [
      "Support payment methods: Credit Card, UPI, Net Banking, Wallet",
      "Process, refund, and capture transactions",
      "Idempotency for duplicate request protection",
      "Webhook notifications for payment status",
      "Fraud detection hooks",
      "Transaction history and reconciliation",
    ],
    constraints: [
      "Each transaction must have unique idempotency key",
      "Refund only possible within 30 days",
      "PCI compliance: never store raw card data",
    ],
    hints: [
      "Think about: Payment, Transaction, PaymentMethod, Provider, Webhook",
      "Use Strategy for each payment method",
      "Use Chain of Responsibility for fraud checks",
      "Use Observer for webhook notifications",
    ],
  },
  {
    id: "job-scheduler",
    tags: ["lld","patterns"],
    title: "Distributed Job Scheduler",
    difficulty: 9,
    description:
      "Design a job scheduling system that can queue, execute, and monitor background jobs with retry and priority support.",
    requirements: [
      "Schedule jobs: immediate, delayed, recurring (cron)",
      "Priority queues (High, Medium, Low)",
      "Job retry with configurable backoff",
      "Job dependency (Job B runs after Job A completes)",
      "Distributed workers with heartbeat monitoring",
      "Job status tracking: Queued, Running, Completed, Failed",
    ],
    constraints: [
      "Max retries: configurable per job",
      "Worker failure detection: 30s heartbeat timeout",
      "Max concurrent jobs per worker: configurable",
    ],
    hints: [
      "Think about: Job, Worker, Queue, Scheduler, JobResult, WorkerRegistry",
      "Use Strategy for retry policies",
      "Use Observer for job events",
      "Use Command pattern for jobs",
      "Consider leader election for distributed coordination",
    ],
  },
  {
    id: "movie-booking",
    tags: ["lld","relationships"],
    title: "Movie Ticket Booking (BookMyShow)",
    difficulty: 6,
    description:
      "Design a movie ticket booking platform with seat selection, concurrent booking safety, and payment.",
    requirements: [
      "Browse movies, theaters, and show timings",
      "Select seats on a visual layout",
      "Concurrent booking — prevent double booking",
      "Apply coupons and calculate final price",
      "Booking confirmation and ticket generation",
      "Cancellation with partial refund",
    ],
    constraints: [
      "Seat lock timeout: 10 minutes to complete payment",
      "Max 6 seats per booking",
      "Cancellation fee: 20% before show, no refund after",
    ],
    hints: [
      "Think about: Movie, Theater, Show, Seat, Booking, Payment",
      "Use Optimistic Locking or temp seat reservation to prevent double booking",
      "Use Strategy for pricing (weekday, weekend, premium)",
      "Use State for booking states",
    ],
  },
  {
    id: "inventory-management",
    tags: ["lld","relationships"],
    title: "Inventory Management System",
    difficulty: 5,
    description:
      "Design an inventory system for an e-commerce warehouse with stock tracking, reordering, and multi-warehouse support.",
    requirements: [
      "Track stock levels per product per warehouse",
      "Reserve stock on order placement",
      "Commit/release reservation on order confirm/cancel",
      "Auto reorder when stock falls below threshold",
      "Inventory transfer between warehouses",
      "Audit trail for all inventory changes",
    ],
    constraints: [
      "Stock can't go negative",
      "Reservation expires after 30 minutes if not committed",
      "Reorder quantity = (max_stock - current_stock)",
    ],
    hints: [
      "Think about: Product, Warehouse, Stock, Reservation, Order, AuditLog",
      "Use Command pattern for inventory operations (reserve, commit, release)",
      "Use Observer for low-stock alerts and reorder triggers",
    ],
  },
  {
    id: "hotel-booking",
    tags: ["lld","factory","state-machine"],
    title: "Hotel Booking System",
    difficulty: 6,
    description:
      "Design a hotel room booking platform with availability search, pricing, and reservation management.",
    requirements: [
      "Search available rooms by date, type, and location",
      "Room types: Single, Double, Suite",
      "Book room with check-in/check-out dates",
      "Dynamic pricing (weekends cost more)",
      "Cancellation policy",
      "Hotel admin: add rooms, set pricing, view bookings",
    ],
    constraints: [
      "Room can only be booked once per date range",
      "Check-in: 2 PM, Check-out: 11 AM",
      "Cancellation free before 24 hours, 50% charge after",
    ],
    hints: [
      "Think about: Hotel, Room, RoomType, Reservation, Guest, PricingRule",
      "Use Strategy for pricing rules",
      "Use Template Method for cancellation policy per room type",
    ],
  },
  {
    id: "expense-splitter",
    tags: ["lld","oop","relationships"],
    title: "Expense Splitter (Splitwise-like)",
    difficulty: 5,
    description:
      "Design an app that tracks shared expenses and calculates who owes whom in a group.",
    requirements: [
      "Create groups and add members",
      "Add expense with split types: Equal, Exact, Percentage",
      "Track balances between all members",
      "Simplify debts (minimize transactions to settle)",
      "Settle up between two members",
      "Expense history with comments",
    ],
    constraints: [
      "Total split must equal 100% for percentage split",
      "Amounts rounded to 2 decimal places",
      "Settled expenses cannot be modified",
    ],
    hints: [
      "Think about: Group, User, Expense, ExpenseSplit, Balance, Settlement",
      "Use Strategy for split types (Equal, Exact, Percentage)",
      "Graph algorithm to simplify debts",
    ],
  },
  {
    id: "social-media-feed",
    tags: ["lld","observer","patterns"],
    title: "Social Media Feed (Twitter/Instagram)",
    difficulty: 7,
    description:
      "Design a social media platform with posts, follows, and a personalized news feed.",
    requirements: [
      "Create posts (text, image, video)",
      "Follow and unfollow users",
      "News feed: posts from followed users",
      "Like, comment, and share posts",
      "Trending topics/hashtags",
      "Notification on likes/comments/follows",
    ],
    constraints: [
      "Feed shows last 100 posts from followed users",
      "Max 280 chars for text posts",
      "User can follow max 5000 others",
    ],
    hints: [
      "Think about: User, Post, Follow, Feed, Like, Comment, Notification",
      "Fan-out on write vs read for feed generation",
      "Use Observer for notifications",
      "Use Strategy for feed ranking",
    ],
  },
  {
    id: "url-shortener",
    tags: ["lld","oop"],
    title: "URL Shortener (bit.ly)",
    difficulty: 4,
    description:
      "Design a URL shortening service that generates short aliases, handles redirects, and tracks analytics.",
    requirements: [
      "Shorten a long URL to a short code",
      "Redirect short URL to original URL",
      "Custom alias support",
      "URL expiration (TTL)",
      "Click analytics: total clicks, unique visitors, by country",
      "User accounts to manage their URLs",
    ],
    constraints: [
      "Short code: 6-8 characters (alphanumeric)",
      "Default expiry: 1 year",
      "Same URL for same user = same short code",
    ],
    hints: [
      "Think about: URL, ShortCode, User, Analytics, ClickEvent",
      "Use hashing (MD5/Base62) for short code generation",
      "Use Strategy for encoding schemes",
      "Use Observer for analytics tracking",
    ],
  },
  {
    id: "rate-limiter",
    tags: ["lld","patterns"],
    title: "Rate Limiter",
    difficulty: 7,
    description:
      "Design a rate limiting service that restricts request rates per user/IP using multiple algorithms.",
    requirements: [
      "Support algorithms: Fixed Window, Sliding Window, Token Bucket, Leaky Bucket",
      "Configure limits per user, per API endpoint, or globally",
      "Return remaining quota and reset time in headers",
      "Distributed rate limiting (multiple server nodes)",
      "Allow burst allowance with token bucket",
    ],
    constraints: [
      "Precision: milliseconds",
      "Redis for distributed state",
      "Config: max_requests, window_size per rule",
    ],
    hints: [
      "Think about: RateLimiter, Rule, RequestContext, LimitResult",
      "Use Strategy for each algorithm",
      "Use Decorator to layer global + user + endpoint limits",
    ],
  },
  {
    id: "event-booking",
    tags: ["lld","state-machine","factory"],
    title: "Event Ticketing System",
    difficulty: 8,
    description:
      "Design a large-scale event ticketing platform (like Ticketmaster) with high concurrency support.",
    requirements: [
      "Browse events by category, date, location",
      "Seat map with real-time availability",
      "Concurrent purchase protection (no overselling)",
      "Waiting list when sold out",
      "Ticket transfer between users",
      "Dynamic pricing based on demand",
    ],
    constraints: [
      "Seat hold timeout: 5 minutes",
      "Max 4 tickets per user per event",
      "Waiting list notified in FIFO order",
    ],
    hints: [
      "Think about: Event, Venue, Ticket, Order, WaitingList, PricingEngine",
      "Use Optimistic/Pessimistic locking for concurrent seat selection",
      "Use Observer for waiting list notifications",
      "Use Strategy for dynamic pricing",
    ],
  },
];
