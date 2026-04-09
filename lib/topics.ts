// ── TOPICS CONFIG ─────────────────────────────────────────────────────────────
// Each topic is a learn page: video + key concepts + linked practice problems.
// problems are fetched dynamically via matchTags — add a tag here to pull in problems.
// videoUrl: YouTube embed URL (leave "" to show "video coming soon").

export interface TopicConcept {
  title: string;
  body: string;
}

export interface Topic {
  id: string;           // URL slug  e.g. "encapsulation"
  title: string;
  subtitle: string;
  emoji: string;
  category: "oop" | "solid" | "patterns" | "lld";
  free: boolean;
  videoUrl: string;     // YouTube embed, e.g. "https://www.youtube.com/embed/VIDEO_ID"
  matchTags: string[];  // problems whose tags overlap with this are shown
  concepts: TopicConcept[];
}

export interface TopicGroup {
  id: string;
  label: string;
  emoji: string;
  description: string;
  topics: Topic[];
}

export const TOPIC_GROUPS: TopicGroup[] = [
  // ── OOP ────────────────────────────────────────────────────────────────────
  {
    id: "oop",
    label: "OOP Foundations",
    emoji: "🧱",
    description: "Master the four pillars of Object-Oriented Programming before diving into design.",
    topics: [
      {
        id: "encapsulation",
        title: "Encapsulation",
        subtitle: "Hide the how, expose the what",
        emoji: "🔒",
        category: "oop",
        free: true,
        videoUrl: "https://www.youtube.com/embed/YbqneqDIZh8",
        matchTags: ["encapsulation"],
        concepts: [
          { title: "What it is", body: "Bundling data (fields) and the methods that operate on it into one unit, and restricting direct access to some of the object's components." },
          { title: "Private fields + public methods", body: "Fields should be private. State should only change through controlled methods. This prevents external code from putting the object into an invalid state." },
          { title: "Why it matters", body: "You can change the internal implementation (e.g. swap a List for a Set) without affecting any caller as long as the public interface stays the same." },
          { title: "Common mistake", body: "Adding a public setter for every private field defeats encapsulation entirely. Expose only what is necessary." },
        ],
      },
      {
        id: "abstraction",
        title: "Abstraction",
        subtitle: "Define contracts, hide complexity",
        emoji: "🎭",
        category: "oop",
        free: true,
        videoUrl: "https://www.youtube.com/embed/VJh2u7NLLDg",
        matchTags: ["abstraction"],
        concepts: [
          { title: "What it is", body: "Hiding implementation complexity behind a simple interface. Callers know WHAT an object does, not HOW it does it." },
          { title: "Abstract class vs Interface", body: "Use an abstract class when subclasses share code. Use an interface when you only need a contract (no shared state or logic)." },
          { title: "Example", body: "A Shape interface declares area() and perimeter(). Circle, Square, and Triangle implement it differently — the caller doesn't care." },
          { title: "Benefit", body: "You can swap implementations (e.g. MySQL → Postgres) without touching callers — they only depend on the abstraction." },
        ],
      },
      {
        id: "inheritance-composition",
        title: "Composition over Inheritance",
        subtitle: "Prefer HAS-A over IS-A",
        emoji: "🔗",
        category: "oop",
        free: true,
        videoUrl: "https://www.youtube.com/embed/hxGOiiR9ZKg",
        matchTags: ["inheritance", "composition"],
        concepts: [
          { title: "The problem with deep inheritance", body: "Deep hierarchies (A extends B extends C) become rigid. A change to the base class ripples everywhere, and the Banana-Gorilla-Jungle problem kicks in." },
          { title: "Composition", body: "Instead of extending a class to reuse behaviour, inject the dependency. Employee HAS-A PayrollService — it doesn't need to BE one." },
          { title: "When inheritance is OK", body: "One level is usually fine when there's a genuine IS-A relationship. But if you're using inheritance just to reuse code, reach for composition instead." },
          { title: "Interfaces + composition", body: "Define capability via interfaces (Payable, Manageable) and inject implementations. This makes roles mix-and-matchable without class explosions." },
        ],
      },
      {
        id: "polymorphism",
        title: "Polymorphism",
        subtitle: "One interface, many behaviours",
        emoji: "🦋",
        category: "oop",
        free: true,
        videoUrl: "https://www.youtube.com/embed/jhDUxynEQRI",
        matchTags: ["polymorphism"],
        concepts: [
          { title: "Runtime polymorphism", body: "A parent reference holds a child object. The actual method called is determined at runtime — this is dynamic dispatch." },
          { title: "The litmus test", body: "If your code has instanceof checks or type-switch logic, your design is wrong. Good polymorphism means the caller never needs to know the concrete type." },
          { title: "Open for extension", body: "Add new payment methods (Crypto, BNPL) without touching Checkout.processPayment() — just add a new class that implements Payment." },
          { title: "Compile-time polymorphism", body: "Method overloading — same name, different parameter types. Less powerful but sometimes useful for convenience APIs." },
        ],
      },
      {
        id: "relationships",
        title: "Object Relationships",
        subtitle: "Composition, Aggregation, Association",
        emoji: "🕸️",
        category: "oop",
        free: true,
        videoUrl: "https://www.youtube.com/embed/duKPtKaEMGw",
        matchTags: ["relationships"],
        concepts: [
          { title: "Composition (strongest)", body: "Part cannot exist without the whole. Order owns LineItems — delete the Order and LineItems go too. Use when lifecycle is bound." },
          { title: "Aggregation (medium)", body: "Whole references the part, but the part can exist independently. Order aggregates Customer — delete the Order, Customer stays." },
          { title: "Association (weakest)", body: "Objects know about each other but neither owns the other. Order uses Payment — both can exist independently." },
          { title: "Interview tip", body: "When asked 'how do X and Y relate?', answer with the relationship type and justify the lifecycle decision. This shows depth of thought." },
        ],
      },
    ],
  },

  // ── SOLID ──────────────────────────────────────────────────────────────────
  {
    id: "solid",
    label: "SOLID Principles",
    emoji: "⚖️",
    description: "The five principles that make object-oriented code maintainable and extensible.",
    topics: [
      {
        id: "srp",
        title: "Single Responsibility",
        subtitle: "One class, one reason to change",
        emoji: "🎯",
        category: "solid",
        free: true,
        videoUrl: "https://www.youtube.com/embed/UQqY3_6Epbg",
        matchTags: ["srp", "solid"],
        concepts: [
          { title: "The principle", body: "A class should have one, and only one, reason to change. If changing the log format also requires touching the class that sends emails — SRP is violated." },
          { title: "How to spot violations", body: "The class name contains 'And' or 'Manager'. It has more than ~5 public methods. Changes to unrelated features keep touching it." },
          { title: "Fix: extract responsibilities", body: "LogFormatter (formatting), FileHandler (IO), LogFilter (level logic) — each has one job. Logger orchestrates them." },
          { title: "Side effect: testability", body: "SRP classes are trivially unit-testable — they do one thing, so mocking is easy and tests are small." },
        ],
      },
      {
        id: "ocp",
        title: "Open / Closed Principle",
        subtitle: "Open for extension, closed for modification",
        emoji: "🚪",
        category: "solid",
        free: true,
        videoUrl: "https://www.youtube.com/embed/_jDNAf3CzeY",
        matchTags: ["ocp", "solid"],
        concepts: [
          { title: "The principle", body: "You should be able to add new behaviour without modifying existing code. The way to achieve this is to depend on abstractions, not concretions." },
          { title: "The smell", body: "You add a new payment type and have to open PriceCalculator to add another else if. Every new feature requires modifying existing classes." },
          { title: "The fix: Strategy pattern", body: "PriceCalculator accepts a list of DiscountStrategy. New discounts are new classes — PriceCalculator is never touched again." },
          { title: "OCP + OOP", body: "Polymorphism is the mechanism that makes OCP possible. Add new behaviour by adding new subclasses/implementations, not by editing existing ones." },
        ],
      },
      {
        id: "lsp",
        title: "Liskov Substitution",
        subtitle: "Subtypes must honour the parent contract",
        emoji: "🔄",
        category: "solid",
        free: false,
        videoUrl: "https://www.youtube.com/embed/dJQMqNOC4Pc",
        matchTags: ["lsp", "solid"],
        concepts: [
          { title: "The principle", body: "If S is a subtype of T, objects of type S can replace T without breaking the programme's correctness." },
          { title: "The classic violation", body: "Square extends Rectangle. Callers expect setWidth(5) to not affect height. Square breaks this — it must keep width == height." },
          { title: "Test", body: "Write tests against the base class contract. Run the same tests on subclasses. If any fail — LSP is violated." },
          { title: "The fix", body: "Don't extend when the subtype can't honour the full contract. Prefer an immutable Shape interface: area() and perimeter() only, no setters." },
        ],
      },
      {
        id: "isp",
        title: "Interface Segregation",
        subtitle: "Clients shouldn't depend on unused methods",
        emoji: "✂️",
        category: "solid",
        free: false,
        videoUrl: "https://www.youtube.com/embed/xahwVmf8itI",
        matchTags: ["isp", "solid"],
        concepts: [
          { title: "The principle", body: "No client should be forced to implement methods it doesn't use. Fat interfaces force implementors to stub out irrelevant methods." },
          { title: "The smell", body: "RobotWorker throws UnsupportedOperationException for eat() and sleep(). That's a sign the Worker interface is too fat." },
          { title: "The fix", body: "Split into Workable, Eatable, Restable. HumanWorker implements all three. RobotWorker implements only Workable." },
          { title: "Benefit", body: "Supervisor only depends on Workable — it can manage both humans and robots without knowing about eating or sleeping." },
        ],
      },
      {
        id: "dip",
        title: "Dependency Inversion",
        subtitle: "Depend on abstractions, not concretions",
        emoji: "🔌",
        category: "solid",
        free: false,
        videoUrl: "https://www.youtube.com/embed/9oHY5TllWaU",
        matchTags: ["dip", "solid"],
        concepts: [
          { title: "The principle", body: "High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details." },
          { title: "The smell", body: "UserService does this.db = new MySQLDatabase() in its constructor. Switching to Postgres requires editing UserService." },
          { title: "Constructor injection", body: "Pass the IUserRepository interface into UserService's constructor. The caller decides which implementation to inject. UserService never imports a concrete DB class." },
          { title: "Benefit: testability", body: "Inject a MockUserRepository in tests. No real database needed. Tests run fast and in isolation." },
        ],
      },
    ],
  },

  // ── DESIGN PATTERNS ────────────────────────────────────────────────────────
  {
    id: "patterns",
    label: "Design Patterns",
    emoji: "🔮",
    description: "Reusable solutions to recurring design problems. Patterns are a vocabulary for design conversations.",
    topics: [
      {
        id: "factory-pattern",
        title: "Factory Pattern",
        subtitle: "Centralise and hide object creation",
        emoji: "🏭",
        category: "patterns",
        free: false,
        videoUrl: "https://www.youtube.com/embed/EcFVTgRHJLM",
        matchTags: ["factory", "patterns"],
        concepts: [
          { title: "Problem it solves", body: "NotificationService has a giant switch-case to create Email/SMS/Push objects. Adding a new type means opening the service." },
          { title: "Solution", body: "Extract a NotificationFactory. It maps type strings to constructors. NotificationService calls factory.create(type) and uses the interface." },
          { title: "Registry variant", body: "Store a Map<string, Constructor> in the factory. Registering a new type = one line. No switch case ever." },
          { title: "When to use", body: "When you need to create objects whose type is determined at runtime, or when creation logic is complex enough to deserve its own class." },
        ],
      },
      {
        id: "builder-pattern",
        title: "Builder Pattern",
        subtitle: "Construct complex objects step by step",
        emoji: "🏗️",
        category: "patterns",
        free: false,
        videoUrl: "https://www.youtube.com/embed/M7Xi1yO_s8E",
        matchTags: ["builder", "patterns"],
        concepts: [
          { title: "Problem it solves", body: "Constructors with 8 parameters are unreadable. Optional parameters cause constructor explosion. Telescoping constructors are a maintenance nightmare." },
          { title: "Fluent interface", body: "Each setter returns 'this', enabling method chaining: QueryBuilder.select('*').from('users').where('active=1').limit(10).build()" },
          { title: "Build is terminal", body: "build() is the last call. It validates required fields (e.g. from() is mandatory) and constructs the final immutable object." },
          { title: "When to use", body: "Objects with many optional parameters, especially when some combinations are invalid. Common for HTTP clients, SQL builders, and config objects." },
        ],
      },
      {
        id: "singleton-pattern",
        title: "Singleton Pattern",
        subtitle: "Guarantee exactly one instance",
        emoji: "1️⃣",
        category: "patterns",
        free: false,
        videoUrl: "https://www.youtube.com/embed/hUE_j6q0LTQ",
        matchTags: ["singleton", "patterns"],
        concepts: [
          { title: "The pattern", body: "A class that ensures only one instance is ever created, providing a global point of access to it." },
          { title: "Thread safety problem", body: "Two threads both see instance == null and both call new AppConfig(). Now you have two instances. The naive singleton is broken." },
          { title: "Fix: double-checked locking", body: "Check null outside the lock (fast path), then check again inside (correctness). Or use a static inner class — Java classloader guarantees thread safety." },
          { title: "When to avoid it", body: "Singletons make testing hard (global state). Consider dependency injection instead — inject one instance as a singleton without the class enforcing it." },
        ],
      },
      {
        id: "observer-pattern",
        title: "Observer Pattern",
        subtitle: "Notify many without knowing who",
        emoji: "👁️",
        category: "patterns",
        free: false,
        videoUrl: "https://www.youtube.com/embed/_BpmfnqjgzQ",
        matchTags: ["observer", "patterns"],
        concepts: [
          { title: "The pattern", body: "A subject maintains a list of observers. When state changes, it notifies all observers without knowing their concrete types." },
          { title: "Key interfaces", body: "Subject: subscribe(observer), unsubscribe(observer), notify(). Observer: onEvent(data). The subject never imports a concrete Observer class." },
          { title: "Real-world analogy", body: "Event listeners in browsers, Redux subscriptions, React's useEffect with dependencies — all are implementations of Observer." },
          { title: "Push vs Pull", body: "Push: subject sends full data in notification. Pull: subject sends minimal signal, observer fetches what it needs. Pull is more flexible." },
        ],
      },
      {
        id: "decorator-pattern",
        title: "Decorator Pattern",
        subtitle: "Add behaviour at runtime without subclassing",
        emoji: "🎁",
        category: "patterns",
        free: false,
        videoUrl: "https://www.youtube.com/embed/GCraGHx6gso",
        matchTags: ["decorator", "patterns"],
        concepts: [
          { title: "The pattern", body: "Wrap an object with another object that has the same interface. The wrapper delegates to the inner object and adds behaviour before/after." },
          { title: "Avoids class explosion", body: "Without Decorator, MilkCoffee, SugarCoffee, MilkSugarCoffee, WhipCoffee... → 2^N classes. With Decorator: just add wrappers at runtime." },
          { title: "Key rule", body: "Every decorator must accept ANY object of the base type, including other decorators. This is what enables stacking." },
          { title: "Real-world", body: "Java's BufferedInputStream wraps FileInputStream. HTTP middleware chains. Express/Koa middleware. All are Decorator." },
        ],
      },
    ],
  },

  // ── LLD ────────────────────────────────────────────────────────────────────
  {
    id: "lld",
    label: "LLD Problems",
    emoji: "💡",
    description: "Full system design problems. Apply everything you've learned to real interview scenarios.",
    topics: [
      {
        id: "state-machine-design",
        title: "State Machine Design",
        subtitle: "Model complex lifecycle with states",
        emoji: "🔁",
        category: "lld",
        free: false,
        videoUrl: "https://www.youtube.com/embed/N12L5D78MAA",
        matchTags: ["state-machine"],
        concepts: [
          { title: "When to use", body: "Any object with a lifecycle: orders (Placed→Packed→Shipped→Delivered), ATMs (Idle→CardInserted→Authenticated), elevators." },
          { title: "State pattern", body: "Extract each state into a class. The context delegates behaviour to the current state. Transitions are explicit." },
          { title: "Transition table", body: "Draw a table: rows = current states, columns = events, cells = next states. This becomes your implementation map." },
          { title: "Invalid transitions", body: "Throw an exception or return an error for invalid state transitions. Never silently ignore them." },
        ],
      },
      {
        id: "strategy-pattern-lld",
        title: "Strategy in LLD",
        subtitle: "Swap algorithms at runtime",
        emoji: "⚡",
        category: "lld",
        free: false,
        videoUrl: "https://www.youtube.com/embed/v9ejT8IIMSo",
        matchTags: ["strategy", "lld"],
        concepts: [
          { title: "Problem", body: "Payment gateway needs to support UPI, Card, NetBanking. Ride fare calculation needs Economy vs Premium pricing. Hard-coding these creates brittle switch-cases." },
          { title: "Solution", body: "Define a Strategy interface. Each algorithm is a class. The context accepts a strategy and delegates to it." },
          { title: "Composable", body: "Strategies can be combined. A fare calculator might apply a BaseStrategy + SurgeStrategy + PromoStrategy in sequence." },
          { title: "Relation to OCP", body: "Strategy is the mechanism that makes OCP achievable — new algorithms are new classes, no existing code changes." },
        ],
      },
    ],
  },
];

// Flat list of all topics for lookup
export const ALL_TOPICS: Topic[] = TOPIC_GROUPS.flatMap((g) => g.topics);
export const TOPIC_MAP = Object.fromEntries(ALL_TOPICS.map((t) => [t.id, t]));
