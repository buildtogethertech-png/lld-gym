import type { Topic } from "@/lib/topics";

export interface TopicSideExample {
  title: string;
  code: string;
}

export interface TopicSideContent {
  /** Short bullets for the right-hand “at a glance” panel */
  takeaways: string[];
  /** One or more code snippets */
  examples: TopicSideExample[];
}

const CATEGORY_CODE: Record<Topic["category"], string> = {
  oop: `// OOP sketch — hide state, expose behaviour
class Account {
  private balance = 0;

  deposit(amount: number) {
    if (amount <= 0) throw new Error("Invalid amount");
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}`,
  solid: `// SOLID sketch — depend on an abstraction
interface PaymentMethod {
  pay(amount: number): void;
}

class Checkout {
  constructor(private payment: PaymentMethod) {}
  charge(amount: number) {
    this.payment.pay(amount);
  }
}`,
  patterns: `// Pattern sketch — programme to an interface
interface Service {
  run(): void;
}

class Context {
  constructor(private svc: Service) {}
  execute() {
    this.svc.run();
  }
}`,
  lld: `// LLD sketch — strategy-style extension point
interface PricingStrategy {
  fare(distanceKm: number): number;
}

class Ride {
  constructor(private pricing: PricingStrategy) {}
  quote(km: number) {
    return this.pricing.fare(km);
  }
}`,
};

/** Richer panels per topic; fallback uses category + subtitle. */
const RICH: Record<string, TopicSideContent> = {
  encapsulation: {
    takeaways: [
      "Keep fields private; mutate state only through methods you control.",
      "Callers depend on behaviour, not on how data is stored.",
    ],
    examples: [
      {
        title: "Private state, public API",
        code: `class Car {
  private speed = 0;

  accelerate(delta: number) {
    if (delta < 0) return;
    this.speed = Math.min(this.speed + delta, 200);
  }

  getSpeed() {
    return this.speed;
  }
}`,
      },
    ],
  },
  abstraction: {
    takeaways: [
      "Callers talk to a small surface; complexity lives behind it.",
      "Interfaces / abstract classes document the contract.",
    ],
    examples: [
      {
        title: "Shape abstraction",
        code: `interface Shape {
  area(): number;
}

class Circle implements Shape {
  constructor(private r: number) {}
  area() {
    return Math.PI * this.r * this.r;
  }
}

function totalArea(shapes: Shape[]) {
  return shapes.reduce((s, x) => s + x.area(), 0);
}`,
      },
    ],
  },
  "inheritance-composition": {
    takeaways: [
      "Prefer HAS-A (inject a service) over IS-A when behaviour varies.",
      "Deep trees are hard to change; composition stays modular.",
    ],
    examples: [
      {
        title: "Composition",
        code: `class EmailService {
  send(to: string, body: string) { /* … */ }
}

class OrderService {
  constructor(private mail: EmailService) {}

  placeOrder() {
    // …
    this.mail.send("user@x.com", "Confirmed");
  }
}`,
      },
    ],
  },
  polymorphism: {
    takeaways: [
      "One interface, many implementations — callers stay dumb.",
      "Avoid instanceof chains; dispatch through the interface.",
    ],
    examples: [
      {
        title: "Polymorphic payment",
        code: `interface Payment {
  authorize(amount: number): boolean;
}

class CardPay implements Payment {
  authorize(amount: number) {
    return amount < 10_000;
  }
}

class UpiPay implements Payment {
  authorize() {
    return true;
  }
}

function checkout(p: Payment, amt: number) {
  if (!p.authorize(amt)) throw new Error("declined");
}`,
      },
    ],
  },
  relationships: {
    takeaways: [
      "Composition: part dies with the whole.",
      "Aggregation / association: looser lifecycles.",
    ],
    examples: [
      {
        title: "Order owns line items",
        code: `class LineItem {
  constructor(public sku: string, public qty: number) {}
}

class Order {
  private items: LineItem[] = [];
  addItem(i: LineItem) {
    this.items.push(i);
  }
  // If Order is deleted, items go with it (composition).
}`,
      },
    ],
  },
  srp: {
    takeaways: [
      "One reason to change per class — split when fixes touch unrelated features.",
      "Small classes are easier to test and reuse.",
    ],
    examples: [
      {
        title: "Split responsibilities",
        code: `class LogFormatter {
  format(level: string, msg: string) {
    return \`[\${level}] \${msg}\`;
  }
}

class FileLogWriter {
  append(line: string) {
    /* write to disk */
  }
}

class Logger {
  constructor(
    private fmt: LogFormatter,
    private writer: FileLogWriter
  ) {}
  info(msg: string) {
    this.writer.append(this.fmt.format("INFO", msg));
  }
}`,
      },
    ],
  },
  ocp: {
    takeaways: [
      "Add new behaviour with new classes, not by editing old ones.",
      "Abstractions + polymorphism unlock extension.",
    ],
    examples: [
      {
        title: "Discount strategies",
        code: `interface Discount {
  apply(price: number): number;
}

class NoDiscount implements Discount {
  apply(p: number) {
    return p;
  }
}

class PercentOff implements Discount {
  constructor(private pct: number) {}
  apply(p: number) {
    return p * (1 - this.pct);
  }
}

class Cart {
  total(base: number, d: Discount) {
    return d.apply(base);
  }
}`,
      },
    ],
  },
  lsp: {
    takeaways: [
      "Subtypes must honour the base contract — no surprise side effects.",
      "If tests written for the base fail on a subtype, LSP is broken.",
    ],
    examples: [
      {
        title: "Honest contract",
        code: `interface Bird {
  move(): void;
}

class Sparrow implements Bird {
  move() {
    /* fly */
  }
}

// Bad: Penguin implements Bird { move() { fly } } — violates expectation.`,
      },
    ],
  },
  isp: {
    takeaways: [
      "Split fat interfaces so clients only depend on what they use.",
      "No dummy / throw implementations for unused methods.",
    ],
    examples: [
      {
        title: "Segregated roles",
        code: `interface Workable {
  work(): void;
}
interface Feedable {
  eat(): void;
}

class Human implements Workable, Feedable {
  work() {}
  eat() {}
}

class Robot implements Workable {
  work() {}
}`,
      },
    ],
  },
  dip: {
    takeaways: [
      "High-level code depends on interfaces; wiring happens at the edge.",
      "Constructor injection makes tests use mocks easily.",
    ],
    examples: [
      {
        title: "Invert the dependency",
        code: `interface UserRepo {
  findById(id: string): Promise<User | null>;
}

class UserService {
  constructor(private repo: UserRepo) {}

  async getName(id: string) {
    const u = await this.repo.findById(id);
    return u?.name ?? "unknown";
  }
}`,
      },
    ],
  },
  "factory-pattern": {
    takeaways: [
      "Centralise creation so callers ask for a product by kind, not new Concrete().",
      "Registries beat giant switch statements as types grow.",
    ],
    examples: [
      {
        title: "Simple factory",
        code: `type Kind = "email" | "sms";

interface Notification {
  send(msg: string): void;
}

function createNotification(kind: Kind): Notification {
  if (kind === "email") return { send: (m) => console.log("email", m) };
  return { send: (m) => console.log("sms", m) };
}`,
      },
    ],
  },
  "builder-pattern": {
    takeaways: [
      "Step-by-step construction; validate at build().",
      "Fluent APIs chain and read like prose.",
    ],
    examples: [
      {
        title: "Fluent builder",
        code: `class Query {
  private cols = "*";
  private tbl = "";
  select(c: string) {
    this.cols = c;
    return this;
  }
  from(t: string) {
    this.tbl = t;
    return this;
  }
  build() {
    if (!this.tbl) throw new Error("from() required");
    return \`SELECT \${this.cols} FROM \${this.tbl}\`;
  }
}

new Query().select("id").from("users").build();`,
      },
    ],
  },
  "singleton-pattern": {
    takeaways: [
      "One instance — watch global state and testability.",
      "Often DI + single registration is cleaner than getInstance().",
    ],
    examples: [
      {
        title: "Lazy singleton (sketch)",
        code: `class Config {
  private static inst: Config | null = null;
  private constructor() {}
  static get instance() {
    if (!this.inst) this.inst = new Config();
    return this.inst;
  }
}`,
      },
    ],
  },
  "observer-pattern": {
    takeaways: [
      "Subject broadcasts; observers react without the subject knowing concrete types.",
      "Unsubscribe to avoid leaks in long-lived UIs.",
    ],
    examples: [
      {
        title: "Subject + observers",
        code: `type Unsub = () => void;

class EventBus<T> {
  private subs: ((payload: T) => void)[] = [];

  subscribe(fn: (payload: T) => void): Unsub {
    this.subs.push(fn);
    return () => {
      this.subs = this.subs.filter((x) => x !== fn);
    };
  }

  emit(payload: T) {
    this.subs.forEach((fn) => fn(payload));
  }
}`,
      },
      {
        title: "Classic interfaces",
        code: `interface Observer {
  update(price: number): void;
}

class Stock {
  private observers: Observer[] = [];
  private price = 0;

  attach(o: Observer) {
    this.observers.push(o);
  }

  setPrice(p: number) {
    this.price = p;
    this.observers.forEach((o) => o.update(p));
  }
}`,
      },
    ],
  },
  "decorator-pattern": {
    takeaways: [
      "Wrap the same interface to add behaviour without subclass explosion.",
      "Decorators can stack — each delegates inward.",
    ],
    examples: [
      {
        title: "Composable beverage",
        code: `interface Beverage {
  cost(): number;
  describe(): string;
}

class Coffee implements Beverage {
  cost() {
    return 40;
  }
  describe() {
    return "Coffee";
  }
}

class Milk implements Beverage {
  constructor(private inner: Beverage) {}
  cost() {
    return this.inner.cost() + 10;
  }
  describe() {
    return this.inner.describe() + " + milk";
  }
}`,
      },
    ],
  },
  "state-machine-design": {
    takeaways: [
      "States + events + transitions — tabulate before you code.",
      "Invalid transitions should fail loudly.",
    ],
    examples: [
      {
        title: "Order states (sketch)",
        code: `type OrderState = "NEW" | "PAID" | "SHIPPED";

class Order {
  private state: OrderState = "NEW";

  pay() {
    if (this.state !== "NEW") throw new Error("invalid");
    this.state = "PAID";
  }

  ship() {
    if (this.state !== "PAID") throw new Error("invalid");
    this.state = "SHIPPED";
  }
}`,
      },
    ],
  },
  "strategy-pattern-lld": {
    takeaways: [
      "Encapsulate algorithms behind one interface.",
      "Swap strategy at runtime (user tier, promo, payment rail).",
    ],
    examples: [
      {
        title: "Fare strategies",
        code: `interface FareStrategy {
  compute(km: number): number;
}

class EconomyFare implements FareStrategy {
  compute(km: number) {
    return 8 * km;
  }
}

class PremiumFare implements FareStrategy {
  compute(km: number) {
    return 15 * km;
  }
}`,
      },
    ],
  },
};

function categoryFallback(topic: Topic): TopicSideContent {
  return {
    takeaways: [
      topic.subtitle,
      "Connect the video to one real system you know (work or side project).",
      "Summarise in your own words in My Notes — that’s what sticks in interviews.",
    ],
    examples: [
      {
        title: `${topic.title} — mental model`,
        code: CATEGORY_CODE[topic.category],
      },
    ],
  };
}

export function getTopicSideContent(topic: Topic): TopicSideContent {
  return RICH[topic.id] ?? categoryFallback(topic);
}
