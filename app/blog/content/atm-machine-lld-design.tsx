export default function Content() {
  return (
    <>
      <p>The ATM Machine LLD is a great problem for practicing the State pattern and Chain of Responsibility. It's asked in fintech company interviews and tests how well you can model a system with strict state transitions and hardware constraints.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>ATM</strong> — facade, delegates to subsystems</li>
        <li><strong>Card</strong> — cardNumber, PIN, linkedAccount</li>
        <li><strong>Account</strong> — balance, accountNumber</li>
        <li><strong>Transaction</strong> — type, amount, timestamp, status</li>
        <li><strong>CashDispenser</strong> — tracks denomination counts, dispenses cash</li>
        <li><strong>ATMState</strong> — interface for state behavior</li>
      </ul>
      <h2>State Pattern for ATM</h2>
      <pre>{`interface ATMState {
  insertCard(atm: ATM, card: Card): void;
  enterPIN(atm: ATM, pin: string): void;
  selectTransaction(atm: ATM, type: TransactionType): void;
  withdraw(atm: ATM, amount: number): void;
  ejectCard(atm: ATM): void;
}

class IdleState implements ATMState {
  insertCard(atm: ATM, card: Card) {
    atm.setCurrentCard(card);
    atm.setState(new CardInsertedState());
  }
  enterPIN() { throw new Error("Insert card first"); }
  withdraw()  { throw new Error("Insert card first"); }
}

class CardInsertedState implements ATMState {
  enterPIN(atm: ATM, pin: string) {
    if (atm.getCurrentCard().validatePIN(pin)) {
      atm.setState(new AuthenticatedState());
    } else {
      atm.incrementPINAttempts();
      if (atm.getPINAttempts() >= 3) {
        atm.blockCard(); atm.setState(new IdleState());
      }
    }
  }
}

class AuthenticatedState implements ATMState {
  withdraw(atm: ATM, amount: number) {
    const account = atm.getLinkedAccount();
    if (account.balance < amount) throw new Error("Insufficient funds");
    atm.getCashDispenser().dispense(amount);
    account.debit(amount);
    atm.setState(new IdleState());
  }
}`}</pre>
      <h2>Chain of Responsibility for Cash Dispensing</h2>
      <pre>{`abstract class NoteDispenser {
  protected next: NoteDispenser | null = null;
  setNext(h: NoteDispenser) { this.next = h; return h; }
  abstract dispense(amount: number): void;
}

class FiveHundredDispenser extends NoteDispenser {
  dispense(amount: number) {
    const count = Math.floor(amount / 500);
    if (count > 0) console.log(\`Dispensed \${count}×₹500\`);
    this.next?.dispense(amount % 500);
  }
}
// Chain: ₹500 → ₹200 → ₹100 → ₹50`}</pre>
      <h2>Common Questions</h2>
      <ul>
        <li>"How do you handle concurrent withdrawals?" → Account balance update must be atomic (DB transaction)</li>
        <li>"What if the ATM runs out of a denomination?" → Skip that handler in the chain</li>
        <li>"How do you log every transaction?" → Observer on Account, every debit/credit fires an event</li>
      </ul>
    </>
  );
}
