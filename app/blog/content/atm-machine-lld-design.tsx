export default function Content() {
  return (
    <>
      <p>
        The ATM Machine is one of the most commonly asked Low Level Design problems in software engineering interviews,
        especially at fintech companies like Paytm, PhonePe, Razorpay, and banks like HDFC and Axis. It tests your
        understanding of the <strong>State design pattern</strong>, the <strong>Chain of Responsibility pattern</strong>,
        and your ability to model hardware-constrained systems cleanly in code.
      </p>
      <p>
        In this complete ATM machine LLD guide, we'll go from requirements to full class diagram to working Java code —
        the same depth you need to clear an LLD interview round.
      </p>

      <h2>Why Interviewers Ask the ATM Machine LLD Problem</h2>
      <p>
        The ATM system is a classic State machine. An ATM can only do certain things in certain states — you cannot
        withdraw money before inserting a card, you cannot enter a PIN before inserting a card, and you cannot insert
        a card if one is already inserted. Interviewers use this problem to test:
      </p>
      <ul>
        <li>Can you identify when the State pattern is the right solution?</li>
        <li>Can you model state transitions without spaghetti <code>if-else</code> blocks?</li>
        <li>Can you apply Chain of Responsibility for cash dispensing across denominations?</li>
        <li>Do you think about security — PIN lockout after 3 wrong attempts, card blocking, session timeout?</li>
        <li>Do you separate concerns — the ATM facade vs the dispenser subsystem vs the bank network?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>User can insert a card and authenticate with a PIN</li>
        <li>User can check account balance</li>
        <li>User can withdraw cash in available denominations</li>
        <li>User can deposit cash or cheque</li>
        <li>Card is blocked after 3 incorrect PIN attempts</li>
        <li>Session is terminated after user ejects the card or after timeout</li>
        <li>ATM maintains a cash inventory across multiple denominations (₹500, ₹200, ₹100, ₹50)</li>
        <li>Every transaction is logged with timestamp, amount, account, and status</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Concurrent withdrawals on the same account must be handled safely (atomic balance update)</li>
        <li>Cash dispensing must be exact — never dispense more or less than requested</li>
        <li>Transaction logs must be immutable — no update or delete</li>
        <li>PIN validation must go to the bank network, not a local cache</li>
      </ul>

      <h2>Core Entities — ATM Machine LLD Class Design</h2>
      <ul>
        <li><strong>ATM</strong> — the top-level facade. Delegates to state, dispenser, and bank network</li>
        <li><strong>ATMState</strong> — interface defining what actions are valid in each state</li>
        <li><strong>IdleState / CardInsertedState / AuthenticatedState / DispensingState</strong> — concrete states</li>
        <li><strong>Card</strong> — cardNumber, maskedPAN, associated accountId</li>
        <li><strong>Account</strong> — accountNumber, balance, linkedCardNumbers</li>
        <li><strong>CashDispenser</strong> — tracks denomination inventory, builds dispense plan</li>
        <li><strong>NoteDispenser</strong> — abstract handler in the Chain of Responsibility</li>
        <li><strong>Transaction</strong> — type (WITHDRAWAL/DEPOSIT/BALANCE), amount, status, timestamp</li>
        <li><strong>BankNetwork</strong> — interface to communicate with the bank for PIN validation and balance updates</li>
        <li><strong>Screen / Keypad / CardReader</strong> — hardware interface abstractions (optional depth)</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`ATM
├── state: ATMState
├── cashDispenser: CashDispenser
├── bankNetwork: BankNetwork
├── currentCard: Card
├── insertCard(card)
├── enterPIN(pin)
├── selectTransaction(type)
├── withdraw(amount)
└── ejectCard()

ATMState (interface)
├── insertCard(atm, card)
├── enterPIN(atm, pin)
├── selectTransaction(atm, type)
├── withdraw(atm, amount)
└── ejectCard(atm)

IdleState implements ATMState
CardInsertedState implements ATMState
AuthenticatedState implements ATMState
DispensingCashState implements ATMState

CashDispenser
├── inventory: Map<Denomination, Integer>
├── canDispense(amount): boolean
└── dispense(amount): DispenseResult

NoteDispenser (abstract) — Chain of Responsibility
├── next: NoteDispenser
├── setNext(handler)
└── dispense(amount) [abstract]

FiveHundredDispenser extends NoteDispenser
TwoHundredDispenser extends NoteDispenser
OneHundredDispenser extends NoteDispenser
FiftyDispenser extends NoteDispenser`}</pre>

      <h2>State Pattern Implementation — ATM LLD in Java</h2>
      <p>
        The State pattern eliminates complex conditional logic. Instead of checking the current state in every method,
        each state class handles only the actions valid in that state and throws an error for everything else.
      </p>
      <pre>{`public interface ATMState {
    void insertCard(ATM atm, Card card);
    void enterPIN(ATM atm, String pin);
    void selectTransaction(ATM atm, TransactionType type);
    void withdraw(ATM atm, double amount);
    void ejectCard(ATM atm);
}

public class IdleState implements ATMState {
    @Override
    public void insertCard(ATM atm, Card card) {
        atm.setCurrentCard(card);
        atm.setState(new CardInsertedState());
        System.out.println("Card inserted. Please enter your PIN.");
    }

    @Override
    public void enterPIN(ATM atm, String pin) {
        throw new IllegalStateException("Please insert card first.");
    }

    @Override
    public void withdraw(ATM atm, double amount) {
        throw new IllegalStateException("Please insert card first.");
    }

    @Override
    public void ejectCard(ATM atm) {
        System.out.println("No card inserted.");
    }
}

public class CardInsertedState implements ATMState {
    private int pinAttempts = 0;

    @Override
    public void insertCard(ATM atm, Card card) {
        throw new IllegalStateException("Card already inserted.");
    }

    @Override
    public void enterPIN(ATM atm, String pin) {
        boolean valid = atm.getBankNetwork().validatePIN(atm.getCurrentCard(), pin);
        if (valid) {
            pinAttempts = 0;
            atm.setState(new AuthenticatedState());
            System.out.println("PIN verified. Select transaction.");
        } else {
            pinAttempts++;
            if (pinAttempts >= 3) {
                atm.getBankNetwork().blockCard(atm.getCurrentCard());
                atm.setState(new IdleState());
                System.out.println("Card blocked after 3 wrong attempts.");
            } else {
                System.out.println("Wrong PIN. " + (3 - pinAttempts) + " attempts left.");
            }
        }
    }
}

public class AuthenticatedState implements ATMState {
    @Override
    public void withdraw(ATM atm, double amount) {
        Account account = atm.getBankNetwork().getAccount(atm.getCurrentCard());
        if (account.getBalance() < amount) {
            System.out.println("Insufficient balance.");
            return;
        }
        if (!atm.getCashDispenser().canDispense(amount)) {
            System.out.println("ATM cannot dispense this amount.");
            return;
        }
        atm.setState(new DispensingCashState());
        atm.getCashDispenser().dispense(amount);
        atm.getBankNetwork().debitAccount(account, amount);
        atm.logTransaction(TransactionType.WITHDRAWAL, amount, TransactionStatus.SUCCESS);
        atm.setState(new IdleState());
        atm.setCurrentCard(null);
    }

    @Override
    public void ejectCard(ATM atm) {
        System.out.println("Card ejected.");
        atm.setState(new IdleState());
        atm.setCurrentCard(null);
    }
}`}</pre>

      <h2>Chain of Responsibility — Cash Dispensing</h2>
      <p>
        Cash dispensing is a classic Chain of Responsibility use case. Each denomination handler tries to dispense as
        many notes as possible, then passes the remainder to the next handler in the chain.
      </p>
      <pre>{`public abstract class NoteDispenser {
    protected NoteDispenser next;

    public NoteDispenser setNext(NoteDispenser next) {
        this.next = next;
        return next;
    }

    public abstract void dispense(double amount);
}

public class FiveHundredDispenser extends NoteDispenser {
    @Override
    public void dispense(double amount) {
        int count = (int)(amount / 500);
        if (count > 0) {
            System.out.println("Dispensed " + count + " x 500");
        }
        double remainder = amount % 500;
        if (remainder > 0 && next != null) {
            next.dispense(remainder);
        }
    }
}

public class TwoHundredDispenser extends NoteDispenser {
    @Override
    public void dispense(double amount) {
        int count = (int)(amount / 200);
        if (count > 0) {
            System.out.println("Dispensed " + count + " x 200");
        }
        double remainder = amount % 200;
        if (remainder > 0 && next != null) {
            next.dispense(remainder);
        }
    }
}

// Wire the chain: 500 -> 200 -> 100 -> 50
public class CashDispenser {
    private NoteDispenser chain;

    public CashDispenser() {
        NoteDispenser h500 = new FiveHundredDispenser();
        NoteDispenser h200 = new TwoHundredDispenser();
        NoteDispenser h100 = new OneHundredDispenser();
        NoteDispenser h50  = new FiftyDispenser();
        h500.setNext(h200).setNext(h100).setNext(h50);
        this.chain = h500;
    }

    public void dispense(double amount) {
        chain.dispense(amount);
    }
}`}</pre>

      <h2>Key Design Decisions and Why</h2>
      <ul>
        <li>
          <strong>State pattern over if-else:</strong> If you use a single class with <code>currentState</code> enum
          and if-else blocks, adding a new state (like a "MaintenanceState") requires touching every method.
          With the State pattern, you just add a new class — Open/Closed Principle.
        </li>
        <li>
          <strong>Chain of Responsibility for dispensing:</strong> The alternative is one method with nested ifs per
          denomination. The chain makes it trivial to add a new denomination (₹2000 notes) or remove one without
          changing existing handlers.
        </li>
        <li>
          <strong>BankNetwork as an interface:</strong> The ATM doesn't talk to a specific bank's API. It talks to
          a <code>BankNetwork</code> interface. Any bank can plug in their implementation — this is Dependency Inversion.
        </li>
        <li>
          <strong>Atomic balance update:</strong> <code>debitAccount</code> on the BankNetwork must use a DB
          transaction. Two concurrent withdrawals on the same account could both read the balance as ₹1000, both
          approve a ₹800 withdrawal, and both deduct — leaving the account at ₹200 instead of the expected negative.
        </li>
      </ul>

      <h2>Common Follow-Up Questions in ATM LLD Interviews</h2>
      <ul>
        <li>
          <strong>"How do you handle concurrent withdrawals from two ATMs on the same account?"</strong>
          — Optimistic locking on the Account row with a version column, or pessimistic locking with a SELECT FOR UPDATE.
          The BankNetwork interface abstracts this — the ATM itself doesn't need to know.
        </li>
        <li>
          <strong>"What if the ATM runs out of a denomination mid-dispense?"</strong>
          — Each NoteDispenser checks its local inventory count before dispensing. If it can't fulfil its portion,
          it throws an InsufficientCashException which rolls back the entire transaction.
        </li>
        <li>
          <strong>"How would you add a mini-statement feature?"</strong>
          — Add a <code>printMiniStatement(atm)</code> method to ATMState. In IdleState and CardInsertedState it
          throws; in AuthenticatedState it fetches the last 5 transactions from the BankNetwork.
        </li>
        <li>
          <strong>"How do you handle session timeout?"</strong>
          — A scheduled task or a timer in ATM resets state to IdleState after 60 seconds of inactivity in
          CardInsertedState or AuthenticatedState.
        </li>
        <li>
          <strong>"How would you log every transaction?"</strong>
          — Observer pattern on the Account. Every debit/credit fires a TransactionEvent. A TransactionLogger
          subscriber persists it to an immutable audit log table.
        </li>
      </ul>

      <h2>What Companies Ask This Problem</h2>
      <p>
        The ATM machine LLD problem is most common at fintech companies — <strong>Paytm, PhonePe, Razorpay, CRED,
        BankBazaar</strong> — and occasionally at product companies with payments teams like Amazon Pay and
        Google Pay. It is also a standard problem at banking technology firms.
      </p>

      <h2>FAQ — ATM Machine Low Level Design</h2>

      <h3>What design patterns are used in ATM machine LLD?</h3>
      <p>
        Two main patterns: the <strong>State pattern</strong> to model the ATM's lifecycle (Idle → Card Inserted →
        Authenticated → Dispensing → Idle), and the <strong>Chain of Responsibility pattern</strong> to handle
        cash dispensing across denominations (₹500 → ₹200 → ₹100 → ₹50). The <strong>Facade pattern</strong>
        is also present — the ATM class acts as a facade over the card reader, dispenser, and bank network subsystems.
      </p>

      <h3>How do you handle wrong PIN in ATM LLD?</h3>
      <p>
        Maintain a <code>pinAttempts</code> counter in <code>CardInsertedState</code>. On each wrong PIN, increment
        the counter. When it reaches 3, call <code>bankNetwork.blockCard(card)</code> and transition back to
        <code>IdleState</code>. The card is now flagged in the bank's system and will be rejected on next insertion.
      </p>

      <h3>What is the difference between ATM LLD and ATM HLD?</h3>
      <p>
        LLD (Low Level Design) focuses on class structure — State pattern, class diagram, method signatures, Java/Python
        code. HLD (High Level Design) focuses on the distributed system — how the ATM network communicates with
        the bank's core system, switch routing, ISO 8583 message format, and how to handle network failures between
        the ATM and the bank.
      </p>

      <h3>How do you dispense exact cash amounts in ATM LLD?</h3>
      <p>
        Use the Chain of Responsibility pattern. Each denomination handler computes how many notes of its denomination
        fit in the remaining amount, dispenses them, and passes the remainder down the chain. Before dispensing,
        <code>CashDispenser.canDispense(amount)</code> validates that the current inventory can fulfil the request exactly.
      </p>
    </>
  );
}
