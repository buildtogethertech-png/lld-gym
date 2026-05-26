export default function Content() {
  return (
    <>
      <p>
        Splitwise Low Level Design is one of the most intellectually rich LLD interview problems. It requires the
        <strong> Strategy pattern</strong> for multiple split types, a balance tracking system, and a graph
        minimization algorithm to simplify debts. It is frequently asked at fintech companies like Razorpay,
        CRED, PhonePe, and Slice. This guide covers the complete Splitwise LLD solution with Java code.
      </p>

      <h2>Why Interviewers Ask Splitwise LLD</h2>
      <p>
        Splitwise tests multiple skills simultaneously — entity design, multiple design patterns, and a
        non-trivial algorithm. Interviewers use it to see:
      </p>
      <ul>
        <li>Can you model financial relationships cleanly — who paid, who owes what?</li>
        <li>Do you use Strategy pattern for extensible split types instead of if-else blocks?</li>
        <li>Can you implement the debt simplification algorithm (graph reduction)?</li>
        <li>Do you separate concerns — ExpenseService vs BalanceService vs SettlementService?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Users can create groups and add members</li>
        <li>A user can add an expense — who paid, how much, who participated</li>
        <li>Support three split types: Equal, Exact amount, Percentage</li>
        <li>Show each user's net balance within a group</li>
        <li>Show who owes whom and how much</li>
        <li>Simplify debts — minimize the number of transactions needed to settle all balances</li>
        <li>Record a settlement when one user pays another</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Split percentages must sum to 100; exact amounts must sum to the total expense</li>
        <li>Balance updates must be atomic — concurrent expense additions must not corrupt balances</li>
        <li>New split types (e.g., shares-based) should be addable without changing existing code</li>
      </ul>

      <h2>Core Entities — Splitwise LLD Class Design</h2>
      <ul>
        <li><strong>User</strong> — id, name, email</li>
        <li><strong>Group</strong> — id, name, list of members, list of expenses</li>
        <li><strong>Expense</strong> — id, description, totalAmount, paidBy (User), split type, participants</li>
        <li><strong>ExpenseSplit</strong> — userId, amount owed for a specific expense</li>
        <li><strong>Balance</strong> — net amount between two users (positive = owed to you)</li>
        <li><strong>Settlement</strong> — from userId, to userId, amount, timestamp</li>
        <li><strong>SplitStrategy</strong> — interface; EqualSplit, ExactSplit, PercentageSplit implement it</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`User
+-- id, name, email

Group
+-- id, name
+-- members: List<User>
+-- expenses: List<Expense>

Expense
+-- id, description, totalAmount
+-- paidBy: User
+-- splitStrategy: SplitStrategy
+-- participants: List<Participant>

Participant
+-- user: User
+-- exactAmount: Double (for ExactSplit)
+-- percentage: Double  (for PercentageSplit)

SplitStrategy (interface)
+-- calculateShares(amount, participants): Map<String, Double>

EqualSplit       implements SplitStrategy
ExactSplit       implements SplitStrategy
PercentageSplit  implements SplitStrategy

Balance
+-- fromUserId, toUserId
+-- amount: double

Settlement
+-- from: User, to: User
+-- amount: double, timestamp`}</pre>

      <h2>Strategy Pattern for Split Types — Java</h2>
      <pre>{`public interface SplitStrategy {
    Map<String, Double> calculateShares(double amount, List<Participant> participants);
}

public class EqualSplit implements SplitStrategy {
    @Override
    public Map<String, Double> calculateShares(double amount, List<Participant> participants) {
        double share = amount / participants.size();
        Map<String, Double> shares = new LinkedHashMap<>();
        participants.forEach(p -> shares.put(p.getUserId(), share));
        return shares;
    }
}

public class ExactSplit implements SplitStrategy {
    @Override
    public Map<String, Double> calculateShares(double amount, List<Participant> participants) {
        double total = participants.stream().mapToDouble(Participant::getExactAmount).sum();
        if (Math.abs(total - amount) > 0.01)
            throw new IllegalArgumentException("Exact amounts must sum to total: " + amount);
        Map<String, Double> shares = new LinkedHashMap<>();
        participants.forEach(p -> shares.put(p.getUserId(), p.getExactAmount()));
        return shares;
    }
}

public class PercentageSplit implements SplitStrategy {
    @Override
    public Map<String, Double> calculateShares(double amount, List<Participant> participants) {
        double totalPct = participants.stream().mapToDouble(Participant::getPercentage).sum();
        if (Math.abs(totalPct - 100) > 0.01)
            throw new IllegalArgumentException("Percentages must sum to 100");
        Map<String, Double> shares = new LinkedHashMap<>();
        participants.forEach(p -> shares.put(p.getUserId(), amount * p.getPercentage() / 100));
        return shares;
    }
}`}</pre>

      <h2>ExpenseService — Recording Expenses and Updating Balances</h2>
      <pre>{`public class ExpenseService {
    private final BalanceRepository balanceRepo;

    public void addExpense(Expense expense) {
        Map<String, Double> shares = expense.getSplitStrategy()
            .calculateShares(expense.getTotalAmount(), expense.getParticipants());

        shares.forEach((userId, share) -> {
            if (userId.equals(expense.getPaidBy().getId())) return;
            // userId owes paidBy 'share' rupees
            balanceRepo.updateBalance(userId, expense.getPaidBy().getId(), share);
        });
    }
}`}</pre>

      <h2>Debt Simplification Algorithm</h2>
      <p>
        This is the hardest part — minimize the number of transactions needed to settle all debts. The algorithm
        computes a net balance for each user (positive = owed money, negative = owes money), then greedily matches
        the largest creditor with the largest debtor.
      </p>
      <pre>{`public List<Settlement> simplifyDebts(Group group) {
    // Step 1: compute net balance per user
    Map<String, Double> netBalance = new HashMap<>();
    for (User member : group.getMembers()) {
        double net = balanceRepo.getNetBalance(member.getId(), group.getId());
        netBalance.put(member.getId(), net);
    }

    // Step 2: split into creditors and debtors
    List<double[]> creditors = new ArrayList<>(); // [userId-hash, amount]
    List<double[]> debtors = new ArrayList<>();

    // Using indices for simplicity; in real code store userId
    List<String> ids = new ArrayList<>(netBalance.keySet());
    for (String id : ids) {
        double bal = netBalance.get(id);
        if (bal > 0.01) creditors.add(new double[]{ids.indexOf(id), bal});
        else if (bal < -0.01) debtors.add(new double[]{ids.indexOf(id), -bal});
    }

    creditors.sort((a, b) -> Double.compare(b[1], a[1]));
    debtors.sort((a, b) -> Double.compare(b[1], a[1]));

    // Step 3: greedily settle
    List<Settlement> settlements = new ArrayList<>();
    int i = 0, j = 0;
    while (i < creditors.size() && j < debtors.size()) {
        double amount = Math.min(creditors.get(i)[1], debtors.get(j)[1]);
        String credId = ids.get((int) creditors.get(i)[0]);
        String debtId = ids.get((int) debtors.get(j)[0]);
        settlements.add(new Settlement(debtId, credId, amount));
        creditors.get(i)[1] -= amount;
        debtors.get(j)[1] -= amount;
        if (creditors.get(i)[1] < 0.01) i++;
        if (debtors.get(j)[1] < 0.01) j++;
    }
    return settlements;
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Strategy over if-else for split types:</strong> If you write
          <code>if (type == EQUAL) ... else if (type == EXACT) ...</code> inside Expense, adding a new split
          type means modifying Expense. With Strategy, it's a new class — Open/Closed Principle.
        </li>
        <li>
          <strong>Participant model instead of just userIds:</strong> Exact and percentage splits need per-participant
          metadata. The Participant class carries userId + optional exactAmount + optional percentage cleanly.
        </li>
        <li>
          <strong>Separate BalanceRepository:</strong> Balances are derived state computed from expenses.
          Keeping them in a dedicated repository with atomic updates prevents race conditions when multiple
          expenses are added concurrently.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"What if two users add expenses to the same group simultaneously?"</strong> — Use optimistic
          locking on balance records, or use a message queue to serialize expense additions per group.
        </li>
        <li>
          <strong>"How do you handle currency conversion for international groups?"</strong> — Add a currency
          field to Expense. BalanceService uses a CurrencyConverter (Strategy pattern again) to normalize all
          balances to a base currency before computing net amounts.
        </li>
        <li>
          <strong>"What is the time complexity of the debt simplification algorithm?"</strong> — O(n log n) for
          sorting creditors and debtors, O(n) for the greedy matching. Total O(n log n).
        </li>
      </ul>

      <h2>FAQ — Splitwise Low Level Design</h2>

      <h3>What design pattern does Splitwise use?</h3>
      <p>
        The primary pattern is <strong>Strategy</strong> for split types (EqualSplit, ExactSplit,
        PercentageSplit). The <strong>Repository pattern</strong> is used for balance tracking, and the
        <strong>Service layer pattern</strong> separates business logic (ExpenseService, BalanceService,
        SettlementService) from domain entities.
      </p>

      <h3>How does Splitwise simplify debts?</h3>
      <p>
        Compute the net balance for each user across all expenses. Users with positive balance are creditors;
        negative balance are debtors. Greedily match the largest debtor with the largest creditor, create a
        settlement for the minimum of the two amounts, and reduce both balances. Repeat until all balances
        are zero. This produces the minimum number of transactions.
      </p>

      <h3>What is the Splitwise LLD class diagram?</h3>
      <p>
        Core classes: User, Group (has many Users and Expenses), Expense (has paidBy User, SplitStrategy,
        and list of Participants), SplitStrategy interface (EqualSplit/ExactSplit/PercentageSplit),
        Balance (net amount between two users), Settlement (payment record).
      </p>
    </>
  );
}
