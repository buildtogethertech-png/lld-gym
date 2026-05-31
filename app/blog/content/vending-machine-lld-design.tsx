export default function Content() {
  return (
    <>
      <p>
        Vending Machine Low Level Design is a classic interview problem that tests your mastery of the
        State pattern. Every button press, coin insertion, and item dispensing is a state transition.
        It is asked at Google, Microsoft, Atlassian, and Goldman Sachs to test whether candidates can
        model complex stateful systems cleanly. This guide covers the complete Vending Machine LLD with
        Java code, class diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Vending Machine LLD</h2>
      <p>Interviewers use this problem to test:</p>
      <ul>
        <li>Can you model the machine lifecycle as a State pattern — not a chain of if-else blocks?</li>
        <li>Do you handle edge cases — insufficient funds, out-of-stock items, exact change only?</li>
        <li>Can you design Inventory as a separate concern from the state machine?</li>
        <li>Do you use the Strategy pattern for different payment methods?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>User selects a product and inserts coins or notes</li>
        <li>Machine dispenses the product if sufficient funds are inserted</li>
        <li>Machine returns change if the user overpays</li>
        <li>If a product is out of stock, the machine informs the user and returns money</li>
        <li>Admin can restock products and collect cash</li>
        <li>Support multiple product slots with different prices</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Invalid state transitions must be rejected — cannot dispense before payment</li>
        <li>Adding a new payment method must not change existing state logic</li>
        <li>Inventory updates must be atomic — concurrent purchases must not oversell</li>
      </ul>

      <h2>Core Entities — Vending Machine LLD Class Design</h2>
      <ul>
        <li><strong>VendingMachine</strong> — Singleton; holds state, inventory, and collected cash</li>
        <li><strong>VendingMachineState</strong> — interface; IdleState, HasMoneyState, DispensingState, OutOfStockState</li>
        <li><strong>Product</strong> — id, name, price, quantity</li>
        <li><strong>Slot</strong> — slotNumber, product, quantity</li>
        <li><strong>Coin / Note</strong> — denomination enum for valid tender</li>
        <li><strong>InventoryManager</strong> — manages product slots and stock levels</li>
        <li><strong>CashRegister</strong> — tracks inserted amount, calculates change</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`VendingMachine (Singleton)
+-- state: VendingMachineState
+-- inventory: InventoryManager
+-- cashRegister: CashRegister
+-- selectProduct(slotNumber): void
+-- insertCoin(coin): void
+-- insertNote(note): void
+-- dispense(): void
+-- cancel(): void

VendingMachineState (interface)
+-- selectProduct(machine, slot): void
+-- insertMoney(machine, amount): void
+-- dispense(machine): void
+-- cancel(machine): void

IdleState       implements VendingMachineState
HasMoneyState   implements VendingMachineState
DispensingState implements VendingMachineState
OutOfStockState implements VendingMachineState

Slot
+-- slotNumber: int
+-- product: Product
+-- quantity: int

CashRegister
+-- insertedAmount: double
+-- insert(amount): void
+-- returnChange(): double
+-- collectAll(): double`}</pre>

      <h2>State Pattern — All Four States in Java</h2>
      <pre>{`public interface VendingMachineState {
    void selectProduct(VendingMachine machine, int slotNumber);
    void insertMoney(VendingMachine machine, double amount);
    void dispense(VendingMachine machine);
    void cancel(VendingMachine machine);
}

public class IdleState implements VendingMachineState {
    @Override
    public void selectProduct(VendingMachine machine, int slotNumber) {
        Slot slot = machine.getInventory().getSlot(slotNumber);
        if (slot == null || slot.getQuantity() == 0) {
            System.out.println("Product out of stock");
            machine.setState(new OutOfStockState());
            return;
        }
        machine.setSelectedSlot(slot);
        System.out.println("Selected: " + slot.getProduct().getName() +
            " — Price: " + slot.getProduct().getPrice());
        machine.setState(new HasMoneyState());
    }

    @Override
    public void insertMoney(VendingMachine machine, double amount) {
        System.out.println("Please select a product first");
    }

    @Override
    public void dispense(VendingMachine machine) {
        System.out.println("Please select a product and insert money");
    }

    @Override
    public void cancel(VendingMachine machine) {
        System.out.println("Nothing to cancel");
    }
}

public class HasMoneyState implements VendingMachineState {
    @Override
    public void selectProduct(VendingMachine machine, int slotNumber) {
        System.out.println("Product already selected. Insert money or cancel.");
    }

    @Override
    public void insertMoney(VendingMachine machine, double amount) {
        machine.getCashRegister().insert(amount);
        double inserted = machine.getCashRegister().getInsertedAmount();
        double price = machine.getSelectedSlot().getProduct().getPrice();
        System.out.println("Inserted: " + inserted + " / Required: " + price);

        if (inserted >= price) {
            machine.setState(new DispensingState());
            machine.dispense(); // auto-dispense once paid
        }
    }

    @Override
    public void dispense(VendingMachine machine) {
        System.out.println("Insufficient funds — please insert more money");
    }

    @Override
    public void cancel(VendingMachine machine) {
        double refund = machine.getCashRegister().returnChange();
        System.out.println("Cancelled. Returned: " + refund);
        machine.setSelectedSlot(null);
        machine.setState(new IdleState());
    }
}

public class DispensingState implements VendingMachineState {
    @Override
    public void selectProduct(VendingMachine machine, int slotNumber) {
        System.out.println("Please wait, dispensing in progress");
    }

    @Override
    public void insertMoney(VendingMachine machine, double amount) {
        System.out.println("Please wait, dispensing in progress");
    }

    @Override
    public void dispense(VendingMachine machine) {
        Slot slot = machine.getSelectedSlot();
        slot.decrementQuantity();
        double change = machine.getCashRegister().returnChange(slot.getProduct().getPrice());
        System.out.println("Dispensing: " + slot.getProduct().getName());
        if (change > 0) System.out.println("Change returned: " + change);
        machine.setSelectedSlot(null);
        machine.setState(new IdleState());
    }

    @Override
    public void cancel(VendingMachine machine) {
        System.out.println("Cannot cancel — dispensing in progress");
    }
}`}</pre>

      <h2>VendingMachine Core</h2>
      <pre>{`public class VendingMachine {
    private static VendingMachine instance;
    private VendingMachineState state;
    private final InventoryManager inventory;
    private final CashRegister cashRegister;
    private Slot selectedSlot;

    private VendingMachine() {
        this.state = new IdleState();
        this.inventory = new InventoryManager();
        this.cashRegister = new CashRegister();
    }

    public static synchronized VendingMachine getInstance() {
        if (instance == null) instance = new VendingMachine();
        return instance;
    }

    public void selectProduct(int slotNumber) { state.selectProduct(this, slotNumber); }
    public void insertMoney(double amount)     { state.insertMoney(this, amount); }
    public void dispense()                     { state.dispense(this); }
    public void cancel()                       { state.cancel(this); }

    // Getters and setters for state, inventory, cashRegister, selectedSlot
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>State pattern over if-else:</strong> Without State pattern, every method on VendingMachine
          has a nested if-else for every possible state. With State, each state handles its own transitions
          and rejects invalid operations with a clear message.
        </li>
        <li>
          <strong>Auto-dispense on sufficient payment:</strong> HasMoneyState calls machine.dispense()
          immediately when the inserted amount reaches the price. This mirrors real vending machine behavior
          and avoids a separate "Press dispense" step.
        </li>
        <li>
          <strong>CashRegister as separate class:</strong> Keeping money tracking in CashRegister (SRP)
          lets you swap the payment mechanism without touching state logic. A credit card payment strategy
          can implement the same insertMoney interface.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you handle partial payment with multiple coins?"</strong> — HasMoneyState
          accumulates inserted amounts in CashRegister. Each insertMoney() call adds to the running total.
          Only when the total reaches the price does the state transition to DispensingState.
        </li>
        <li>
          <strong>"How do you add a credit card payment method?"</strong> — Add a CardPaymentStrategy
          implementing a PaymentMethod interface. insertMoney receives a PaymentMethod instead of a double.
          The state machine does not change — only the payment mechanism changes.
        </li>
        <li>
          <strong>"How do you handle concurrent users on different machines?"</strong> — Each physical
          machine is one Singleton instance. Slot.decrementQuantity() is synchronized. In a distributed
          vending network, inventory sync goes through a central service.
        </li>
      </ul>

      <h2>FAQ — Vending Machine Low Level Design</h2>

      <h3>What design patterns are used in Vending Machine LLD?</h3>
      <p>
        The primary pattern is <strong>State</strong> (IdleState, HasMoneyState, DispensingState,
        OutOfStockState). <strong>Singleton</strong> ensures one machine instance. <strong>Strategy</strong>
        can be applied for different payment methods (coins, notes, card).
      </p>

      <h3>How many states does a Vending Machine have?</h3>
      <p>
        Four core states: Idle (waiting for selection), HasMoney (product selected, collecting payment),
        Dispensing (releasing product and returning change), OutOfStock (selected item unavailable).
        Some designs add a Maintenance state for admin operations.
      </p>

      <h3>How do you handle out-of-stock in Vending Machine LLD?</h3>
      <p>
        In IdleState.selectProduct(), check slot quantity before transitioning. If zero, transition to
        OutOfStockState and display a message. OutOfStockState rejects all user actions except cancel.
        On admin restock, transition back to IdleState.
      </p>

      <h3>How is the Vending Machine problem different from ATM Machine LLD?</h3>
      <p>
        Both use State pattern, but Vending Machine uses a simpler payment flow (coin accumulation) and
        has an inventory dimension (multiple product slots). ATM uses Chain of Responsibility for cash
        dispensing (note denominations) and requires PIN authentication before any cash operation.
      </p>
    </>
  );
}
