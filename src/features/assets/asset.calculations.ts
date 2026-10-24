type DecimalLike<T> = {
  plus(value: T): T;
  minus(value: T): T;
  toString(): string;
};

export function calculateTradableHoldings<T extends DecimalLike<T>>(
  transactions: { type: string; quantity: T | null }[],
  zero: T,
): T {
  return transactions.reduce((total, transaction) => {
    if (!transaction.quantity) return total;
    return transaction.type === "BUY"
      ? total.plus(transaction.quantity)
      : transaction.type === "SELL"
        ? total.minus(transaction.quantity)
        : total;
  }, zero);
}

export function calculateCurrentRecordedValue<T extends { times(value: T): T }>(holdings: T, price: T): T {
  return holdings.times(price);
}

export function hasSufficientHoldings<T extends { lessThanOrEqualTo(value: T): boolean }>(
  holdings: T,
  requestedQuantity: T,
) {
  return requestedQuantity.lessThanOrEqualTo(holdings);
}

export function calculateCashBalance<T extends DecimalLike<T> & { negated(): T }>(
  transactions: { amount: T | null; type: string }[],
  zero: T,
): T {
  return transactions.reduce((total, transaction) => {
    if (!transaction.amount) return total;
    const amount = transaction.type === "WITHDRAWAL"
      ? transaction.amount.negated()
      : transaction.amount;
    return total.plus(amount);
  }, zero);
}