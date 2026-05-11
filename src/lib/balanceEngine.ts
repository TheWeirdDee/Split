import { keccak256, toBytes } from 'viem';

export interface GroupBalance {
  from: string;
  to: string;
  amount: number;
}

export const calculateGroupBalances = (
  expenses: any[],
  splits: any[],
  settlements: any[]
): GroupBalance[] => {
  const netBalances: Record<string, number> = {};

  expenses.forEach(expense => {
    const payer = expense.paid_by;
    const expenseSplits = splits.filter(s => s.expense_id === expense.id);
    
    expenseSplits.forEach(split => {
      const borrower = split.wallet_address;
      const amount = parseFloat(split.amount);
      
      if (borrower !== payer) {
        // Borrower owes Payer
        netBalances[borrower] = (netBalances[borrower] || 0) - amount;
        netBalances[payer] = (netBalances[payer] || 0) + amount;
      }
    });
  });

  settlements.forEach(settlement => {
    const debtor = settlement.debtor;
    const creditor = settlement.creditor;
    const amount = parseFloat(settlement.amount);
    
    // Debt is reduced
    netBalances[debtor] = (netBalances[debtor] || 0) + amount;
  netBalances[creditor] = (netBalances[creditor] || 0) - amount;
  });

  const debtors: { address: string; amount: number }[] = [];
  const creditors: { address: string; amount: number }[] = [];

  Object.entries(netBalances).forEach(([address, balance]) => {
    if (balance < -0.0001) { // Floating point precision
      debtors.push({ address, amount: Math.abs(balance) });
    } else if (balance > 0.0001) {
      creditors.push({ address, amount: balance });
    }
  });

  const results: GroupBalance[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const settlementAmount = Math.min(debtor.amount, creditor.amount);

    results.push({
      from: debtor.address,
      to: creditor.address,
      amount: settlementAmount
    });

    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;

    if (debtor.amount < 0.0001) d++;
    if (creditor.amount < 0.0001) c++;
  }

  return results;
};

export const getUserNetBalance = (address: string, balances: GroupBalance[]): number => {
  let net = 0;
  balances.forEach(b => {
    if (b.from.toLowerCase() === address.toLowerCase()) {
      net -= b.amount;
    } else if (b.to.toLowerCase() === address.toLowerCase()) {
      net += b.amount;
    }
  });
  return net;
};

export const splitEqually = (total: number, participants: string[]): Record<string, number> => {
  if (participants.length === 0) return {};
  const perPerson = total / participants.length;
  const result: Record<string, number> = {};
  participants.forEach(p => {
    result[p] = perPerson;
  });
  return result;
};

export const generateGroupId = (uuid: string): `0x${string}` => {
  return keccak256(toBytes(uuid));
};
