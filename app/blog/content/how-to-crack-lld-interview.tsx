export default function Content() {
  return (
    <>
      <p>The Low Level Design (LLD) interview round is one of the most misunderstood rounds in software engineering interviews. Unlike DSA rounds where you're solving algorithmic puzzles, LLD tests how you think about building real software systems. This guide gives you a step-by-step strategy to crack it at Amazon, Flipkart, Swiggy, and other top product companies.</p>

      <h2>What Is the LLD Round?</h2>
      <p>In an LLD round, you're given a real-world system to design — like Parking Lot, BookMyShow, or Splitwise — and asked to define classes, relationships, and design patterns. The interviewer is evaluating:</p>
      <ul>
        <li>Object-oriented thinking (entities, relationships, inheritance vs composition)</li>
        <li>SOLID principles application</li>
        <li>Design pattern knowledge (Strategy, Observer, Factory, State, etc.)</li>
        <li>Ability to handle requirements changes ("what if we add surge pricing?")</li>
        <li>Code quality — clean, readable, maintainable</li>
      </ul>

      <h2>The 5-Step Framework</h2>
      <p>Follow this framework in every LLD interview:</p>

      <h3>Step 1: Clarify Requirements (5 minutes)</h3>
      <p>Never start designing before asking questions. Ask about:</p>
      <ul>
        <li>Scale — how many users, how many requests/sec?</li>
        <li>Edge cases — what happens when capacity is full?</li>
        <li>Extensibility — what features might be added later?</li>
        <li>Constraints — any specific tech requirements?</li>
      </ul>
      <p>This shows maturity and prevents you from designing the wrong thing.</p>

      <h3>Step 2: Identify Core Entities (5 minutes)</h3>
      <p>List the nouns from your requirements — these become your classes. For a Ride Sharing app: Rider, Driver, Trip, Vehicle, Location, Fare. Don't over-engineer — start with the minimum set.</p>

      <h3>Step 3: Define Relationships (5 minutes)</h3>
      <p>For each entity pair, decide the relationship:</p>
      <ul>
        <li><strong>Has-a</strong> (composition): Trip has a Rider, Driver, Location</li>
        <li><strong>Is-a</strong> (inheritance): Bike, Car, Truck extend Vehicle</li>
        <li><strong>Uses</strong> (dependency): TripService uses FareCalculator</li>
      </ul>
      <p>Prefer composition over inheritance — this is what interviewers want to see.</p>

      <h3>Step 4: Apply Design Patterns (10 minutes)</h3>
      <p>Identify which patterns fit naturally — don't force them. The most common patterns in LLD interviews:</p>
      <ul>
        <li><strong>Strategy</strong> — when behavior varies by type (pricing, payment methods, algorithms)</li>
        <li><strong>Observer</strong> — when multiple objects need to react to state changes (notifications, real-time updates)</li>
        <li><strong>State</strong> — when an object has multiple states with different behaviors (driver states, booking states)</li>
        <li><strong>Factory</strong> — when object creation logic is complex or needs to be centralized</li>
        <li><strong>Singleton</strong> — when exactly one instance is needed (Logger, Config)</li>
        <li><strong>Decorator</strong> — when you need to add behavior dynamically (surge pricing on base fare)</li>
      </ul>

      <h3>Step 5: Write Clean Code (20 minutes)</h3>
      <p>Write code that is readable and communicates intent. Use meaningful names, keep methods small, and always implement at least 2-3 core classes fully rather than 10 classes as stubs.</p>

      <h2>SOLID Principles Cheatsheet for LLD</h2>
      <ul>
        <li><strong>SRP</strong>: Each class does one thing. ParkingLot manages floors, not pricing.</li>
        <li><strong>OCP</strong>: Add new vehicle types without modifying existing classes. Use abstract Vehicle.</li>
        <li><strong>LSP</strong>: Any subclass of Vehicle should work wherever Vehicle is expected.</li>
        <li><strong>ISP</strong>: Don't force a class to implement methods it doesn't need. Split large interfaces.</li>
        <li><strong>DIP</strong>: Depend on abstractions. Trip depends on FareStrategy interface, not HourlyFare directly.</li>
      </ul>

      <h2>The 3 Things That Differentiate Top Candidates</h2>

      <h3>1. They think about extensibility</h3>
      <p>When you use Strategy pattern for pricing, you're implicitly saying "this will change." Interviewers love when candidates proactively mention: "I'm using Strategy here so we can add surge pricing or monthly passes later without touching this class."</p>

      <h3>2. They handle edge cases</h3>
      <p>What happens when the parking lot is full? When a driver rejects all nearby requests? When two users book the same seat simultaneously? Mentioning these and having a clean answer separates strong candidates.</p>

      <h3>3. They write actual code, not just diagrams</h3>
      <p>Many candidates draw boxes and arrows but never write a line of code. Interviewers at top companies want to see working class definitions, method signatures, and at least one complete flow end-to-end.</p>

      <h2>Common Mistakes That Fail Candidates</h2>
      <ul>
        <li>Starting to code without clarifying requirements</li>
        <li>Creating god classes (one class that does everything)</li>
        <li>Using if-else chains instead of polymorphism</li>
        <li>Ignoring thread safety in systems that clearly need it</li>
        <li>Over-engineering (adding microservices, databases) when the question is about OOP design</li>
        <li>Not knowing at least 5 design patterns by name and when to use them</li>
      </ul>

      <h2>30-Day LLD Preparation Plan</h2>
      <ul>
        <li><strong>Week 1</strong>: Master OOP fundamentals — encapsulation, inheritance, polymorphism, abstraction</li>
        <li><strong>Week 2</strong>: Study SOLID principles with examples. Write violations and fixes.</li>
        <li><strong>Week 3</strong>: Learn 8 core design patterns: Strategy, Observer, Factory, State, Command, Decorator, Singleton, Template Method</li>
        <li><strong>Week 4</strong>: Practice 10 LLD problems end-to-end with full code. Get AI feedback on your solutions.</li>
      </ul>

      <h2>The Fastest Way to Improve</h2>
      <p>Reading about LLD is not enough. You need to actually write code and get feedback. The biggest gap between candidates who pass and those who don't is deliberate practice with real evaluation — not just watching YouTube videos.</p>
    </>
  );
}
