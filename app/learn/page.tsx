import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why LLD & foundations — LLD Gym",
  description:
    "Why low-level design matters, what you can achieve, OOP basics, and design patterns with short examples. Free reading.",
};

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#161616] overflow-hidden my-4">
      {title && (
        <div className="px-4 py-2 border-b border-gray-800 text-xs font-medium text-gray-500">{title}</div>
      )}
      <pre className="p-4 text-xs text-gray-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">
        {children.trim()}
      </pre>
    </div>
  );
}

export default function LearnPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Problems
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Reading room <span className="text-yellow-400">📖</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Free material — no account needed to read. Use the problems tab to practice with AI feedback.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-xs mb-10 pb-6 border-b border-gray-800">
        <a href="#why" className="text-yellow-400 hover:underline">
          Why LLD
        </a>
        <span className="text-gray-700">·</span>
        <a href="#achieve" className="text-gray-500 hover:text-gray-300">
          What you can achieve
        </a>
        <span className="text-gray-700">·</span>
        <a href="#oop" className="text-gray-500 hover:text-gray-300">
          OOP
        </a>
        <span className="text-gray-700">·</span>
        <a href="#patterns" className="text-gray-500 hover:text-gray-300">
          Patterns
        </a>
      </nav>

      {/* ── Why LLD ── */}
      <section id="why" className="mb-14 scroll-mt-24">
        <h2 className="text-xl font-bold text-white mb-4">Why low-level design matters</h2>
        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <p>
            In interviews and on the job, &ldquo;can you code?&rdquo; is only half the story. Teams need people who can
            <span className="text-yellow-400/90"> name the right objects</span>, draw clear boundaries, and evolve a
            system without turning it into spaghetti.
          </p>
          <p>
            <strong className="text-gray-200">Low-level design (LLD)</strong> is exactly that: turning a vague feature into
            classes, relationships, and APIs that other engineers can understand and extend. It sits between high-level
            architecture (many services, big picture) and line-by-line coding.
          </p>
          <p>
            If you only grind LeetCode-style algorithms, you may still freeze when asked to &ldquo;design a parking
            lot&rdquo; or &ldquo;model a library lending system.&rdquo; LLD practice closes that gap — it trains the same
            muscle senior engineers use every sprint.
          </p>
        </div>
      </section>

      {/* ── What you can achieve ── */}
      <section id="achieve" className="mb-14 scroll-mt-24">
        <h2 className="text-xl font-bold text-white mb-4">What you can achieve here</h2>
        <ul className="space-y-3 text-sm text-gray-300">
          <li className="flex gap-3">
            <span className="text-yellow-400 shrink-0">→</span>
            <span>
              <strong className="text-gray-200">Interview confidence</strong> — structured answers for OOP, SOLID, and
              classic design questions instead of rambling.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400 shrink-0">→</span>
            <span>
              <strong className="text-gray-200">Clearer code reviews</strong> — you&apos;ll recognize smells and suggest
              better abstractions because you&apos;ve named them before.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400 shrink-0">→</span>
            <span>
              <strong className="text-gray-200">Faster ramp-up on new codebases</strong> — reading UML-ish mental models
              and module boundaries becomes natural.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400 shrink-0">→</span>
            <span>
              <strong className="text-gray-200">Honest feedback</strong> — in LLD Gym, AI evaluation pushes on entities,
              relationships, SOLID, patterns, and code quality so you know what to improve next.
            </span>
          </li>
        </ul>
        <p className="mt-6 text-sm text-gray-500">
          Momentum beats perfection: one problem, one revision, repeat. Small daily reps compound.
        </p>
      </section>

      {/* ── OOP ── */}
      <section id="oop" className="mb-14 scroll-mt-24">
        <h2 className="text-xl font-bold text-white mb-2">OOP — quick pillars with examples</h2>
        <p className="text-sm text-gray-500 mb-6">
          These four ideas show up in almost every LLD discussion. Examples are minimal TypeScript-style pseudocode.
        </p>

        <div className="space-y-10">
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Encapsulation</h3>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              Hide internal state; expose a small, stable interface. Callers shouldn&apos;t reach into your object&apos;s
              guts.
            </p>
            <CodeBlock title="Balance hidden, only deposit/withdraw allowed">
              {`class BankAccount {
  private balance = 0;
  deposit(amount: number) {
    if (amount > 0) this.balance += amount;
  }
  withdraw(amount: number) {
    if (amount > 0 && amount <= this.balance) this.balance -= amount;
  }
  getBalance() { return this.balance; }
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Abstraction</h3>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              Work with ideas (&ldquo;payment method&rdquo;) instead of concrete implementations (&ldquo;this exact
              gateway&rdquo;). Reduces coupling.
            </p>
            <CodeBlock title="Caller uses Payment, not Stripe vs Razorpay">
              {`interface Payment {
  pay(amount: number): Promise<void>;
}

class Checkout {
  constructor(private payment: Payment) {}
  async charge(total: number) {
    await this.payment.pay(total);
  }
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Inheritance</h3>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              Share common behavior through an &ldquo;is-a&rdquo; hierarchy. Use sparingly — composition is often
              better; inheritance is for true specialization.
            </p>
            <CodeBlock title="Specialized notifications">
              {`class Notification {
  send(msg: string) { /* base */ }
}
class EmailNotification extends Notification {
  send(msg: string) { /* send via SMTP */ }
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Polymorphism</h3>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              Same interface, different behavior — the runtime picks the right implementation (e.g. many shapes, one
              &ldquo;area()&rdquo; method).
            </p>
            <CodeBlock title="Different animals, one speak()">
              {`interface Animal { speak(): string; }
class Dog implements Animal {
  speak() { return "woof"; }
}
class Cat implements Animal {
  speak() { return "meow"; }
}
function greet(a: Animal) { console.log(a.speak()); }`}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* ── Patterns ── */}
      <section id="patterns" className="mb-14 scroll-mt-24">
        <h2 className="text-xl font-bold text-white mb-2">Design patterns — three workhorses</h2>
        <p className="text-sm text-gray-500 mb-6">
          Patterns are named solutions to recurring problems. Don&apos;t force them — recognize when they fit.
        </p>

        <div className="space-y-10">
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Singleton</h3>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              One shared instance (config, logger, connection pool). Easy to overuse; prefer dependency injection when
              you can test without globals.
            </p>
            <CodeBlock title="Lazy single instance">
              {`class Config {
  private static instance: Config;
  private constructor() {}
  static getInstance() {
    if (!Config.instance) Config.instance = new Config();
    return Config.instance;
  }
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Observer</h3>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              When one object changes, many dependents get notified (event buses, UI updates, domain events).
            </p>
            <CodeBlock title="Subject notifies subscribers">
              {`class NewsPublisher {
  private subs: ((headline: string) => void)[] = [];
  subscribe(fn: (h: string) => void) { this.subs.push(fn); }
  publish(headline: string) {
    this.subs.forEach((fn) => fn(headline));
  }
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Strategy</h3>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              Swap algorithms at runtime behind one interface (pricing rules, discount engines, sorting).
            </p>
            <CodeBlock title="Different discount strategies">
              {`interface Discount {
  apply(price: number): number;
}
class NoDiscount implements Discount {
  apply(p: number) { return p; }
}
class PercentOff implements Discount {
  constructor(private pct: number) {}
  apply(p: number) { return p * (1 - this.pct); }
}
class Cart {
  constructor(private discount: Discount) {}
  checkout(price: number) { return this.discount.apply(price); }
}`}
            </CodeBlock>
          </div>
        </div>
      </section>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-400 mb-4">Ready to apply this on real prompts?</p>
        <Link
          href="/"
          className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Open problems
        </Link>
      </div>
    </div>
  );
}
