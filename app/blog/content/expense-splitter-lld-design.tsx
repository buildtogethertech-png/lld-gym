export default function Content() {
  return (
    <>
      <p>Designing Splitwise tests your ability to model financial relationships, implement multiple split strategies, and solve a graph minimization problem for debt simplification. It's asked at fintech SDE interviews and makes for an excellent LLD problem.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>User</strong> — name, email, balance map (who owes them)</li>
        <li><strong>Group</strong> — members, list of expenses</li>
        <li><strong>Expense</strong> — paid by, amount, split type, participants</li>
        <li><strong>ExpenseSplit</strong> — how much each participant owes</li>
        <li><strong>Balance</strong> — net amount between two users</li>
        <li><strong>Settlement</strong> — records a payment between two users</li>
      </ul>
      <h2>Strategy Pattern for Split Types</h2>
      <pre>{`interface SplitStrategy {
  calculateShares(amount: number, participants: Participant[]): Map<string, number>;
}

class EqualSplit implements SplitStrategy {
  calculateShares(amount: number, participants: Participant[]) {
    const share = amount / participants.length;
    return new Map(participants.map(p => [p.userId, share]));
  }
}

class ExactSplit implements SplitStrategy {
  calculateShares(amount: number, participants: Participant[]) {
    const total = participants.reduce((s, p) => s + p.exactAmount!, 0);
    if (Math.abs(total - amount) > 0.01) throw new Error("Amounts don't add up");
    return new Map(participants.map(p => [p.userId, p.exactAmount!]));
  }
}

class PercentageSplit implements SplitStrategy {
  calculateShares(amount: number, participants: Participant[]) {
    const totalPct = participants.reduce((s, p) => s + p.percentage!, 0);
    if (Math.abs(totalPct - 100) > 0.01) throw new Error("Percentages must sum to 100");
    return new Map(participants.map(p => [p.userId, amount * p.percentage! / 100]));
  }
}`}</pre>
      <h2>Balance Tracking</h2>
      <pre>{`class ExpenseService {
  addExpense(paidBy: User, amount: number, participants: Participant[], strategy: SplitStrategy) {
    const shares = strategy.calculateShares(amount, participants);
    shares.forEach((share, userId) => {
      if (userId === paidBy.id) return;
      // userId owes paidBy 'share' rupees
      this.balanceRepo.updateBalance(userId, paidBy.id, share);
    });
  }
}`}</pre>
      <h2>Debt Simplification Algorithm</h2>
      <p>This is the hardest part — minimize the number of transactions to settle all debts:</p>
      <pre>{`simplifyDebts(group: Group): Settlement[] {
  // Compute net balance for each user
  const netBalance = new Map<string, number>();
  group.members.forEach(m => {
    const net = this.balanceRepo.getNetBalance(m.id, group.id);
    netBalance.set(m.id, net); // +ve = owed money, -ve = owes money
  });

  const creditors = [...netBalance.entries()].filter(([,b]) => b > 0).sort((a,b) => b[1]-a[1]);
  const debtors   = [...netBalance.entries()].filter(([,b]) => b < 0).sort((a,b) => a[1]-b[1]);
  const settlements: Settlement[] = [];

  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const [credId, cred] = creditors[i];
    const [debtId, debt] = debtors[j];
    const amount = Math.min(cred, -debt);
    settlements.push({ from: debtId, to: credId, amount });
    creditors[i][1] -= amount;
    debtors[j][1]   += amount;
    if (creditors[i][1] === 0) i++;
    if (debtors[j][1]  === 0) j++;
  }
  return settlements;
}`}</pre>
    </>
  );
}
