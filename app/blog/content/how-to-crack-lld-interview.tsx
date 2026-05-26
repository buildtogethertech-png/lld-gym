export default function Content() {
  return (
    <>
      <p>
        Cracking the Low Level Design interview round requires a structured approach that most candidates
        miss. At Amazon, Flipkart, Swiggy, Uber, and other top product companies, LLD rounds test entity
        design, SOLID principles, design patterns, and communication — not just code. This guide gives you
        a step-by-step strategy to ace any LLD interview in 45-60 minutes.
      </p>

      <h2>What Interviewers Are Actually Testing</h2>
      <p>
        Before you write a single class, understand what the interviewer is measuring:
      </p>
      <ul>
        <li><strong>Requirements clarity</strong> — Do you clarify before coding, or do you assume?</li>
        <li><strong>Entity modeling</strong> — Do you find the right classes with the right responsibilities?</li>
        <li><strong>SOLID principles</strong> — Is your design extensible? Does each class do one thing?</li>
        <li><strong>Design pattern usage</strong> — Do you apply patterns correctly, not forcefully?</li>
        <li><strong>Communication</strong> — Do you explain your reasoning as you go?</li>
        <li><strong>Edge cases</strong> — Do you proactively mention concurrency, validation, failure modes?</li>
      </ul>

      <h2>The 6-Step Framework for Any LLD Problem</h2>

      <h3>Step 1 — Clarify Requirements (5 minutes)</h3>
      <p>
        Never start designing without understanding the scope. Ask:
      </p>
      <ul>
        <li>"What are the core features? Which can I deprioritize?"</li>
        <li>"What are the expected load characteristics? (1 user or 1 million?)"</li>
        <li>"Are there specific design constraints — must use a particular pattern?"</li>
        <li>"Is this a read-heavy or write-heavy system?"</li>
      </ul>
      <pre>{`// Parking Lot — clarifying questions to ask:
// - How many floors? Is it multi-level?
// - What vehicle types? Bikes, Cars, Trucks?
// - Is pricing hourly or flat rate?
// - Do I need a display board? Entry/exit panels?
// - Should I handle concurrent access?`}</pre>
      <p>
        Most candidates skip this. The few who ask clarifying questions signal seniority before writing a
        single line of code.
      </p>

      <h3>Step 2 — List Functional and Non-Functional Requirements (3 minutes)</h3>
      <p>
        Write these on the whiteboard or in your document:
      </p>
      <ul>
        <li>Functional: what the system does</li>
        <li>Non-functional: concurrency, extensibility, performance constraints</li>
      </ul>
      <pre>{`// Example: Movie Ticket Booking
// Functional:
//   - Browse shows, select seats, pay, confirm booking
//   - Cancel within 24 hours for full refund
// Non-functional:
//   - No double-booking under concurrent access
//   - Seat lock expires in 10 minutes if payment not completed
//   - Adding a new pricing type must not modify BookingService`}</pre>

      <h3>Step 3 — Identify Core Entities (7 minutes)</h3>
      <p>
        Extract nouns from your requirements. Every noun is a potential entity. Filter to those that carry
        unique data or behavior.
      </p>
      <ul>
        <li>Ask: does this noun have unique attributes of its own?</li>
        <li>Ask: does this noun have behavior (methods) beyond getters/setters?</li>
        <li>Ask: does this noun have its own lifecycle?</li>
      </ul>
      <pre>{`// Movie Booking entities:
// Movie, Cinema, Screen, Show, Seat, Ticket, Booking,
// User, Payment, SeatLock, PricingStrategy

// NOT entities (they are attributes or enum values):
// "seat category" (enum field on Seat)
// "booking status" (enum field on Booking)
// "seat availability" (derived from Seat.status)`}</pre>

      <h3>Step 4 — Draw the Class Diagram (10 minutes)</h3>
      <p>
        For each entity, define: fields, relationships (has-a, is-a), and key methods. Use text if no
        whiteboard. Do not draw every getter and setter — focus on the relationships and domain methods.
      </p>
      <pre>{`// Text-based class diagram format:
// ClassName
// +-- field: Type
// +-- method(params): ReturnType

// Booking
// +-- id: String
// +-- show: Show, user: User
// +-- seats: List<Seat>
// +-- totalAmount: double
// +-- status: BookingStatus
// +-- paymentId: String`}</pre>

      <h3>Step 5 — Identify and Apply Design Patterns (10 minutes)</h3>
      <p>
        Look for pattern opportunities in your requirements:
      </p>
      <ul>
        <li>Multiple algorithms / behaviors → Strategy</li>
        <li>State-dependent behavior → State pattern</li>
        <li>React to changes → Observer</li>
        <li>Create objects based on type → Factory</li>
        <li>Sequential checks / pipeline → Chain of Responsibility</li>
        <li>Unique global instance → Singleton</li>
      </ul>
      <pre>{`// Applying Strategy for pricing:
public interface PricingStrategy {
    double calculatePrice(Show show, List<Seat> seats);
}
public class CategoryPricing implements PricingStrategy { ... }
public class SurgePricing    implements PricingStrategy { ... }

// BookingService receives strategy via constructor injection (DIP)
public class BookingService {
    private final PricingStrategy pricing;
    public BookingService(PricingStrategy pricing) {
        this.pricing = pricing;
    }
}`}</pre>

      <h3>Step 6 — Code the Critical Path (20 minutes)</h3>
      <p>
        Do not try to code everything. Code the most complex or pattern-critical part:
      </p>
      <ul>
        <li>The locking/concurrency mechanism (e.g., seat locking)</li>
        <li>The design pattern implementation (e.g., Strategy, State)</li>
        <li>The core service method (e.g., confirmBooking, parkVehicle)</li>
      </ul>
      <p>
        For anything else, say: "I would implement getters/setters here, similar to what I showed for
        Booking. Let me focus on the complex parts." Interviewers respect prioritization.
      </p>

      <h2>Common LLD Interview Mistakes</h2>
      <ul>
        <li>
          <strong>Jumping to code without clarifying:</strong> You will design the wrong system. Always
          spend 5 minutes on requirements.
        </li>
        <li>
          <strong>Over-engineering:</strong> Not every field needs a builder. Not every string needs a
          value object. Design for the stated requirements, not hypothetical future ones.
        </li>
        <li>
          <strong>Ignoring concurrency:</strong> Most LLD problems have a concurrent access problem
          (double-booking, double-allocation). Mention it even if you do not have time to fully implement
          it. "I would synchronize on the Seat object here to prevent two threads from allocating the same
          seat."
        </li>
        <li>
          <strong>Using if-else instead of Strategy:</strong> This is the most common signal that a
          candidate does not know design patterns. Any time you write
          "if type is EQUAL... else if type is EXACT", replace it with a Strategy.
        </li>
        <li>
          <strong>Not communicating:</strong> An interviewer who cannot follow your thought process gives
          you no credit for correct thinking. Narrate every major decision.
        </li>
      </ul>

      <h2>How to Practice LLD Effectively</h2>
      <ul>
        <li>
          <strong>Start with requirements, always:</strong> For every practice problem, write functional
          and non-functional requirements before opening your editor.
        </li>
        <li>
          <strong>Draw before you code:</strong> Spend 15 minutes on entity design and class diagram.
          Coding before thinking produces spaghetti.
        </li>
        <li>
          <strong>Practice naming patterns:</strong> After each design, identify which patterns you used
          and which SOLID principles your design follows.
        </li>
        <li>
          <strong>Time yourself:</strong> A real LLD round is 45-60 minutes. Practice under time pressure
          to learn what to prioritize.
        </li>
        <li>
          <strong>Mock interviews:</strong> Code with someone watching and ask for feedback. The interview
          is a communication exercise as much as a coding one.
        </li>
      </ul>

      <h2>LLD Problem Cheat Sheet</h2>
      <pre>{`Problem              | Key Pattern(s)          | Hardest Part
-------------------- | ----------------------- | ---------------------------
Parking Lot          | Strategy, Singleton      | Concurrent slot assignment
Splitwise            | Strategy                 | Debt simplification algorithm
Ride Sharing         | State, Strategy          | Driver matching, fare surge
Movie Booking        | State Machine            | Concurrent seat locking
Elevator             | State, Strategy          | SCAN algorithm
LRU Cache            | None (data structure)    | O(1) get + O(1) set
Rate Limiter         | Strategy                 | Sliding window concurrency
ATM Machine          | State, Chain             | Cash dispensing algorithm
Notification System  | Strategy, Observer       | Rate limiting + retry
Payment Gateway      | Chain, Strategy          | Idempotency`}</pre>

      <h2>FAQ — How to Crack the LLD Interview</h2>

      <h3>How much time should I spend on design vs coding in an LLD round?</h3>
      <p>
        Roughly 40% design (requirements + entities + class diagram + patterns) and 60% coding. Never
        skip the design phase even if the interviewer says "just code." They will ask you to explain
        your design anyway — you need to have thought about it. If you are running out of time, code
        the critical path and describe the rest verbally.
      </p>

      <h3>Do I need to write working code or is pseudocode OK?</h3>
      <p>
        Working compilable Java or Python is preferred at top companies. Pseudocode is acceptable if
        you clearly explain what it does. If you choose pseudocode, say so upfront: "I will write
        Java-flavored pseudocode to focus on design rather than syntax." Then be consistent —
        pseudocode with real syntax for critical parts is confusing.
      </p>

      <h3>What should I do if I do not know the right design pattern?</h3>
      <p>
        Describe the problem you are trying to solve: "I need the pricing algorithm to be swappable
        without changing ParkingLot." Then ask the interviewer: "Is this a good use case for Strategy?"
        Most interviewers will confirm and appreciate that you identified the need even if you did not
        remember the name. Pattern knowledge helps, but design intuition matters more.
      </p>

      <h3>How many LLD problems should I practice before interviews?</h3>
      <p>
        At minimum: Parking Lot (beginner), Ride Sharing or Movie Booking (intermediate), and one
        advanced (Elevator, Rate Limiter, or Payment Gateway). The goal is not to memorize solutions
        but to internalize the process: requirements → entities → patterns → code. After 10 problems
        using the same framework, you can adapt to any new problem in an interview.
      </p>
    </>
  );
}
