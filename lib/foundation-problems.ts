import { Problem } from "./types";

export const FOUNDATION_PROBLEMS: Problem[] = [

  // ── OOP FOUNDATIONS ─────────────────────────────────────────────────────

  {
    id: "oop-encapsulation-car",
    free: true,
    category: "foundation",
    topic: "OOP",
    title: "Encapsulation: Car – Engine – Wheel",
    difficulty: 1,
    description:
      "Model a Car that owns an Engine and 4 Wheels. Practice proper encapsulation: fields should be private, state should only change through controlled methods. A car should start only if the engine is healthy, and should not allow direct mutation of its internal parts.",
    requirements: [
      "Car has a private Engine and private list of Wheels",
      "Engine has state: IDLE, RUNNING, OVERHEATED",
      "Car.start() — fails if engine is already running or overheated",
      "Car.accelerate(speed) — only works when engine is RUNNING",
      "Car.stop() — transitions engine back to IDLE",
      "Wheel has pressure (psi) — Car.checkTires() returns list of under-inflated wheels (< 30 psi)",
      "No public setters that allow bypassing business rules",
    ],
    constraints: [
      "Do NOT expose raw fields (no public engine, no public wheels[])",
      "All state transitions must go through methods, not direct assignment",
    ],
    hints: [
      "Ask yourself: what CAN'T the caller be allowed to do?",
      "Engine state transitions: IDLE → RUNNING → IDLE or OVERHEATED",
      "Encapsulation = hiding HOW, exposing WHAT",
    ],
  },

  {
    id: "oop-abstraction-bank",
    free: true,
    category: "foundation",
    topic: "OOP",
    title: "Abstraction: User – Account – Transaction",
    difficulty: 1,
    description:
      "Design a banking model where User holds multiple Accounts (Savings, Current, Fixed Deposit). Use an abstract Account class or interface to define a common contract, while each account type has its own behavior for deposits, withdrawals, and interest.",
    requirements: [
      "Abstract Account with: deposit(), withdraw(), getBalance(), getAccountType()",
      "SavingsAccount: 4% annual interest, max ₹50,000/day withdrawal",
      "CurrentAccount: no interest, overdraft up to ₹10,000 allowed",
      "FixedDepositAccount: no withdrawals before maturity date",
      "User can hold multiple accounts",
      "Transaction records each operation with timestamp and amount",
    ],
    constraints: [
      "Account is abstract — you cannot instantiate it directly",
      "Each Account type enforces its own rules in withdraw()",
    ],
    hints: [
      "Abstract class vs interface: use abstract class when you have shared implementation",
      "FixedDepositAccount.withdraw() should throw before maturity",
      "Transaction is a value object — immutable after creation",
    ],
  },

  {
    id: "oop-inheritance-composition",
    free: true,
    category: "foundation",
    topic: "OOP",
    title: "Composition over Inheritance: Employee Roles",
    difficulty: 1,
    description:
      "You are given a broken design where Manager extends Employee extends Person — a deep 3-level hierarchy. The problem: a Contractor also needs some Manager capabilities but isn't a full-time employee. Refactor it to use composition and interfaces so roles are mix-and-matchable without inheritance chains.",
    requirements: [
      "Define interfaces: Payable, Manageable, Reportable",
      "Employee implements Payable + Reportable",
      "Manager implements Payable + Manageable + Reportable",
      "Contractor implements Payable only (no benefits, no direct reports)",
      "Each class composes behaviour through injected services, not by inheriting from base classes",
      "Show why Contractor extends Manager would be wrong",
    ],
    constraints: [
      "Max 1 level of class inheritance allowed",
      "Shared logic (e.g. tax calculation) must live in a reusable service, not a base class",
    ],
    hints: [
      "Ask: 'Is a Contractor a Manager?' — No. So don't extend.",
      "Composition: Employee HAS-A PayrollService, not IS-A PayrollService",
      "Interfaces describe capability, not identity",
    ],
  },

  {
    id: "oop-polymorphism-payment",
    free: true,
    category: "foundation",
    topic: "OOP",
    title: "Polymorphism: Payment System",
    difficulty: 1,
    description:
      "Design a payment system where Cash, CreditCard, and UPI all implement the same Payment interface but behave differently. A Checkout class should process any payment without knowing which type it is — that's runtime polymorphism.",
    requirements: [
      "Payment interface with: pay(amount), refund(amount), getPaymentType()",
      "CashPayment: no refund (returns cash physically), pay() just records",
      "CreditCardPayment: pay() charges card, refund() reverses charge, has card details",
      "UPIPayment: pay() sends UPI request, refund() initiates reversal, has VPA",
      "Checkout.processPayment(Payment p, amount) — works with any Payment",
      "Checkout.refundPayment(Payment p, amount) — same interface",
    ],
    constraints: [
      "Checkout must NOT use instanceof or type-checking",
      "Adding a new payment method (e.g. Wallet) should NOT require changes to Checkout",
    ],
    hints: [
      "The power of polymorphism: caller doesn't need to know the concrete type",
      "If you find yourself writing if (p instanceof CashPayment), your design is wrong",
      "CashPayment.refund() can throw UnsupportedOperationException",
    ],
  },

  {
    id: "oop-relationships-order",
    free: true,
    category: "foundation",
    topic: "OOP",
    title: "Relationships: Order – Item – Payment",
    difficulty: 2,
    description:
      "Model an e-commerce Order to understand the three types of object relationships: Composition (Order owns LineItems — items cannot exist without the order), Aggregation (Order references a Customer — customer exists independently), and Association (Order uses a Payment — payment can outlive the order).",
    requirements: [
      "Order COMPOSES LineItems — LineItem has no meaning outside an Order",
      "Order AGGREGATES a Customer — Customer exists independently",
      "Order ASSOCIATES with Payment — Payment is separate, can reference multiple orders",
      "Order.addItem(product, qty) — adds LineItem internally",
      "Order.calculateTotal() — sums all LineItem prices",
      "Order.placeOrder(payment) — validates and creates a payment record",
      "Customer.getOrderHistory() — returns all orders for this customer",
    ],
    constraints: [
      "LineItem cannot be created outside Order context (make constructor package-private or use factory on Order)",
      "Deleting an Order should also delete its LineItems (cascade)",
      "Deleting an Order should NOT delete the Customer or Payment",
    ],
    hints: [
      "Composition = 'part of' (lifecycle bound). Aggregation = 'has a' (lifecycle independent)",
      "Association = 'uses' (loosest relationship, just holds a reference)",
      "Think about what happens when the Order is deleted — what gets deleted with it?",
    ],
  },

  // ── SOLID PRINCIPLES ────────────────────────────────────────────────────

  {
    id: "solid-srp-logger",
    free: true,
    category: "foundation",
    topic: "SOLID",
    title: "SRP: Fix the Overloaded Logger",
    difficulty: 2,
    description:
      "You are given a Logger class that does too much: it formats log messages, filters by level, writes to console, writes to a file, AND sends critical logs to a database. This violates the Single Responsibility Principle. Refactor it so each class has exactly one reason to change.",
    requirements: [
      "LogFormatter — formats a log entry (timestamp + level + message)",
      "LogFilter — decides whether a log should pass based on minimum level",
      "ConsoleHandler — writes formatted logs to console",
      "FileHandler — writes formatted logs to a file path",
      "DatabaseHandler — persists CRITICAL logs to DB",
      "Logger — orchestrates the above, but owns none of the logic itself",
      "Demonstrate: changing log format should only require editing LogFormatter",
    ],
    constraints: [
      "Logger class must not contain any formatting, filtering, or IO logic",
      "Each handler should be independently testable",
    ],
    hints: [
      "SRP = one reason to change. Format changes → only LogFormatter changes",
      "Handlers can implement a common Handler interface",
      "Logger just calls filter → format → handlers in sequence",
    ],
  },

  {
    id: "solid-ocp-discounts",
    free: true,
    category: "foundation",
    topic: "SOLID",
    title: "OCP: Extend Discounts Without Modifying",
    difficulty: 2,
    description:
      "A PriceCalculator class uses a long if-else chain to apply discounts: if user is Student, apply 10%; if Festive season, apply 20%; if Premium member, apply 15%. Every new discount type requires modifying the calculator. Refactor to follow the Open/Closed Principle — open for extension, closed for modification.",
    requirements: [
      "DiscountStrategy interface with: apply(originalPrice): number",
      "StudentDiscount, FestiveDiscount, PremiumDiscount each implement it",
      "PriceCalculator accepts a list of DiscountStrategy and applies them in order",
      "New discount types (e.g. FlashSaleDiscount) added WITHOUT touching PriceCalculator",
      "Discounts are composable — student + festive stacks",
    ],
    constraints: [
      "PriceCalculator must have ZERO if-else or switch on discount type",
      "Total discount should not exceed 50% of original price",
    ],
    hints: [
      "OCP in practice = Strategy pattern",
      "PriceCalculator just loops through strategies — it doesn't know what they are",
      "Adding new behaviour = add new class, not edit existing ones",
    ],
  },

  {
    id: "solid-lsp-shapes",
    category: "foundation",
    topic: "SOLID",
    title: "LSP: The Square–Rectangle Problem",
    difficulty: 2,
    description:
      "The classic LSP violation: Square extends Rectangle. Since a square's width and height must always be equal, setting width changes height too — this breaks the Rectangle contract and surprises callers. Identify WHY this violates LSP, then redesign the shape hierarchy correctly.",
    requirements: [
      "Explain the violation: show a test that passes for Rectangle but fails for Square",
      "Fix Option A: make both Shape subclasses without inheritance between them",
      "Fix Option B: use a read-only Shape interface (area(), perimeter()) — no setters",
      "Show that the fixed design passes the same test for both Square and Rectangle",
      "Apply the same thinking to Bird → FlyingBird → Penguin (another LSP violation)",
    ],
    constraints: [
      "Square must NOT extend Rectangle (or vice versa) in the final design",
      "Substituting Square for Shape in any caller must not break the caller",
    ],
    hints: [
      "LSP: if S is a subtype of T, then objects of type S can replace T without breaking behaviour",
      "The problem is mutable setters — if you make shapes immutable, LSP is preserved",
      "Penguin IS-A Bird, but NOT IS-A FlyingBird — model that with separate interfaces",
    ],
  },

  {
    id: "solid-isp-worker",
    category: "foundation",
    topic: "SOLID",
    title: "ISP: Break the Fat Worker Interface",
    difficulty: 2,
    description:
      "A Worker interface has four methods: work(), eat(), sleep(), requestLeave(). HumanWorker implements all. RobotWorker also implements Worker, but has to throw UnsupportedOperationException for eat(), sleep(), and requestLeave(). This forces clients to depend on methods they don't use. Apply Interface Segregation.",
    requirements: [
      "Break Worker into: Workable (work()), Eatable (eat()), Restable (sleep()), LeaveTakeable (requestLeave())",
      "HumanWorker implements all four",
      "RobotWorker implements only Workable",
      "Supervisor depends only on Workable — can manage both humans and robots",
      "HRSystem depends on Eatable + Restable + LeaveTakeable — only works with humans",
    ],
    constraints: [
      "No class should implement methods that throw UnsupportedOperationException",
      "Supervisor must NOT need to change when RobotWorker is added",
    ],
    hints: [
      "ISP: no client should be forced to depend on methods it doesn't use",
      "Each interface should be small and focused — one capability",
      "Many small interfaces > one fat interface",
    ],
  },

  {
    id: "solid-dip-database",
    category: "foundation",
    topic: "SOLID",
    title: "DIP: Decouple the Database Layer",
    difficulty: 2,
    description:
      "UserService directly instantiates MySQLDatabase inside its constructor: `this.db = new MySQLDatabase()`. This means switching to PostgreSQL requires editing UserService. Testing UserService requires a real database. Apply Dependency Inversion — high-level modules should not depend on low-level modules; both should depend on abstractions.",
    requirements: [
      "IUserRepository interface with: findById(id), save(user), delete(id)",
      "MySQLUserRepository implements IUserRepository",
      "PostgreSQLUserRepository implements IUserRepository (same contract)",
      "UserService accepts IUserRepository in its constructor (constructor injection)",
      "Show how to swap database without touching UserService",
      "Show how to inject a MockUserRepository in tests",
    ],
    constraints: [
      "UserService must not import or reference MySQLUserRepository or PostgreSQLUserRepository",
      "All dependencies must be injected — no new inside UserService",
    ],
    hints: [
      "DIP = depend on abstractions (interfaces), not concretions (classes)",
      "The injection point is the constructor — pass the dependency in, don't create it inside",
      "This pattern makes unit testing trivial — inject a mock",
    ],
  },

  // ── DESIGN PATTERNS ─────────────────────────────────────────────────────

  {
    id: "pattern-factory-notifications",
    category: "foundation",
    topic: "Design Patterns",
    title: "Factory Pattern: Notification Creator",
    difficulty: 3,
    description:
      "A NotificationService creates different notification objects based on type: EMAIL, SMS, PUSH. Currently it has a giant switch-case inline. Extract a NotificationFactory that encapsulates object creation, so adding a new channel (e.g. SLACK) requires zero changes to NotificationService.",
    requirements: [
      "Notification interface with: send(recipient, message), getChannel()",
      "EmailNotification, SMSNotification, PushNotification each implement it",
      "NotificationFactory.create(type: string): Notification",
      "NotificationService uses factory — has no switch/if on type",
      "Show adding SlackNotification: only add new class + register in factory",
    ],
    constraints: [
      "NotificationService must not contain any type-switch logic",
      "Factory should throw a clear error for unknown types",
    ],
    hints: [
      "Factory pattern = centralise and hide object creation logic",
      "Use a registry map (string → constructor) for the cleanest factory",
      "NotificationService just calls factory.create() and uses the interface",
    ],
    free: true,
  },

  {
    id: "pattern-builder-query",
    category: "foundation",
    topic: "Design Patterns",
    title: "Builder Pattern: SQL Query Builder",
    difficulty: 3,
    description:
      "Building a SQL query string by concatenating strings leads to bugs and unreadable code. Design a QueryBuilder using the Builder pattern that lets you construct SELECT queries step-by-step with a fluent interface, then call .build() to get the final SQL string.",
    requirements: [
      "QueryBuilder.select(...columns) — which columns to fetch",
      "QueryBuilder.from(table) — source table",
      "QueryBuilder.where(condition) — optional filter (multiple calls = AND)",
      "QueryBuilder.orderBy(column, direction) — optional sort",
      "QueryBuilder.limit(n) — optional row limit",
      "QueryBuilder.build() — returns the final SQL string",
      "Method chaining (fluent interface): each method returns `this`",
    ],
    constraints: [
      "from() is mandatory — build() throws if no table set",
      "select() defaults to '*' if not called",
      "Multiple where() calls are joined with AND",
    ],
    hints: [
      "Builder = construct complex objects step by step",
      "Fluent interface = each setter returns 'this' so you can chain",
      "build() is the terminal operation — it constructs the final product",
    ],
  },

  {
    id: "pattern-singleton-config",
    category: "foundation",
    topic: "Design Patterns",
    title: "Singleton Pattern: Thread-Safe Config Manager",
    difficulty: 3,
    description:
      "Design an AppConfig singleton that loads configuration from environment/file once and provides global read access. Understand WHY naive singletons break in multithreaded environments and implement a thread-safe version.",
    requirements: [
      "AppConfig.getInstance() always returns the same instance",
      "Config loaded once at first getInstance() call (lazy initialization)",
      "Config is read-only after loading: get(key), getInt(key), getBool(key)",
      "AppConfig.reload() — only for testing/hot reload, protected by lock",
      "Show the race condition in a naive singleton (no locks)",
      "Fix with double-checked locking or initialization-on-demand pattern",
    ],
    constraints: [
      "No public constructor",
      "getInstance() must be safe to call from multiple threads simultaneously",
    ],
    hints: [
      "Naive singleton: two threads both see instance == null and both create it",
      "Double-checked locking: check null once outside lock, once inside",
      "In Java/TS: use a static inner class or module-level variable (module is a singleton in Node.js)",
    ],
  },

  {
    id: "pattern-observer-stockprice",
    category: "foundation",
    topic: "Design Patterns",
    title: "Observer Pattern: Stock Price Alerts",
    difficulty: 3,
    description:
      "Design a StockMarket system where multiple observers (mobile app, email alert, dashboard widget) are notified whenever a stock price changes. Observers can subscribe and unsubscribe at runtime without the StockMarket knowing what they are.",
    requirements: [
      "StockObserver interface with: onPriceChange(symbol, oldPrice, newPrice)",
      "StockMarket (subject) with: subscribe(observer), unsubscribe(observer), updatePrice(symbol, price)",
      "MobileAlertObserver, EmailAlertObserver, DashboardObserver each implement StockObserver",
      "When price changes, all subscribed observers are notified automatically",
      "Show: add observer, trigger price update, remove observer, trigger again — removed observer should NOT fire",
    ],
    constraints: [
      "StockMarket must not import or reference any concrete Observer class",
      "Notifications happen synchronously in order of subscription",
    ],
    hints: [
      "Observer = pub/sub without a broker. Subject knows its observers directly.",
      "Store observers in a list; on update, loop and call onPriceChange()",
      "This is exactly how event listeners in browsers work",
    ],
  },

  {
    id: "pattern-decorator-coffee",
    category: "foundation",
    topic: "Design Patterns",
    title: "Decorator Pattern: Coffee Customisation",
    difficulty: 3,
    description:
      "Design a coffee ordering system where a base Coffee can be decorated with add-ons (Milk, Sugar, Whip, VanillaSyrup) at runtime. Each add-on wraps the base object, adding to the cost and description — without creating a class explosion of MilkSugarWhipCoffee, MilkCoffee, etc.",
    requirements: [
      "Coffee interface with: getDescription(): string, getCost(): number",
      "SimpleCoffee (base): 'Coffee', ₹50",
      "MilkDecorator: wraps any Coffee, adds 'Milk' to description, +₹15",
      "SugarDecorator: wraps any Coffee, adds 'Sugar', +₹5",
      "WhipDecorator: wraps any Coffee, adds 'Whip', +₹20",
      "Show: SimpleCoffee → add Milk → add Whip → add Sugar = correct total and description",
      "Decorators can be stacked in any order",
    ],
    constraints: [
      "No subclass for each combination (no MilkWhipCoffee class)",
      "Each decorator must accept ANY Coffee (including another decorator)",
    ],
    hints: [
      "Decorator = wrap an object with another object that has the same interface",
      "Each decorator stores a reference to the wrapped Coffee and delegates to it",
      "MilkDecorator.getCost() = this.wrapped.getCost() + 15",
    ],
  },
];

export const FOUNDATION_GROUPS = [
  {
    id: "oop",
    label: "OOP Foundations",
    emoji: "🧱",
    topic: "OOP",
    description: "Classes, encapsulation, abstraction, inheritance, polymorphism, and relationships",
  },
  {
    id: "solid",
    label: "SOLID Principles",
    emoji: "⚖️",
    topic: "SOLID",
    description: "SRP, OCP, LSP, ISP, DIP — the 5 principles that make code maintainable",
  },
  {
    id: "patterns",
    label: "Design Patterns",
    emoji: "🔮",
    topic: "Design Patterns",
    description: "Factory, Builder, Singleton, Observer, Decorator — patterns that appear in every interview",
  },
];
