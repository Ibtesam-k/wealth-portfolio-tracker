import assert from "node:assert/strict";
import test from "node:test";
import { Decimal } from "@prisma/client/runtime/client";
import {
  calculateCashBalance,
  calculateCurrentRecordedValue,
  calculateTradableHoldings,
  hasSufficientHoldings,
} from "./asset.calculations.ts";
import { validateLedgerTransaction } from "./asset.validation.ts";

test("tradable assets accept BUY and SELL with decimal-string fields", () => {
  for (const type of ["BUY", "SELL"]) {
    const result = validateLedgerTransaction("STOCK", {
      type,
      quantity: "2.50",
      unitPrice: "12.34",
    });

    assert.equal(result.success, true);
    assert.equal(result.data.type, type);
    assert.equal(result.data.quantity, "2.50");
    assert.equal(result.data.unitPrice, "12.34");
  }
});

test("tradable transactions reject non-positive values and client-derived amount", () => {
  for (const input of [
    { type: "BUY", quantity: "0", unitPrice: "10" },
    { type: "SELL", quantity: "-1", unitPrice: "10" },
    { type: "BUY", quantity: "1", unitPrice: "0" },
    { type: "BUY", quantity: "1", unitPrice: "10", amount: "10" },
  ]) {
    assert.equal(validateLedgerTransaction("CRYPTO", input).success, false);
  }
});

test("cash transaction types are rejected for tradable assets", () => {
  assert.equal(
    validateLedgerTransaction("STOCK", { type: "DEPOSIT", amount: "25" }).success,
    false,
  );
  assert.equal(
    validateLedgerTransaction("CRYPTO", { type: "OPENING_BALANCE", amount: "25" }).success,
    false,
  );
});

test("occurrence date defaults and malformed dates are rejected", () => {
  const defaulted = validateLedgerTransaction("STOCK", {
    type: "BUY",
    quantity: "1",
    unitPrice: "5",
  });
  assert.equal(defaulted.success, true);
  if (defaulted.success) assert.equal(Number.isNaN(defaulted.data.occurredAt.getTime()), false);

  assert.equal(
    validateLedgerTransaction("STOCK", {
      type: "SELL",
      quantity: "1",
      unitPrice: "5",
      occurredAt: "not-a-date",
    }).success,
    false,
  );
});

test("BUY 5, BUY 2, SELL 3, SELL 4 results in zero holdings and value", () => {
  const holdings = calculateTradableHoldings([
    { type: "BUY", quantity: new Decimal("5") },
    { type: "BUY", quantity: new Decimal("2") },
    { type: "SELL", quantity: new Decimal("3") },
    { type: "SELL", quantity: new Decimal("4") },
  ], new Decimal("0"));

  assert.equal(holdings.toString(), "0");
  assert.equal(calculateCurrentRecordedValue(holdings, new Decimal("125.50")).toString(), "0");
});

test("fractional tradable holdings and current recorded value stay decimal-safe", () => {
  const holdings = calculateTradableHoldings([
    { type: "BUY", quantity: new Decimal("0.5") },
    { type: "BUY", quantity: new Decimal("0.1") },
    { type: "SELL", quantity: new Decimal("0.2") },
  ], new Decimal("0"));

  assert.equal(holdings.toString(), "0.4");
  assert.equal(calculateCurrentRecordedValue(holdings, new Decimal("3.25")).toString(), "1.3");
  assert.equal(hasSufficientHoldings(holdings, new Decimal("0.4")), true);
  assert.equal(hasSufficientHoldings(holdings, new Decimal("0.4000000001")), false);
});

test("cash balance and latest real-estate valuation selection reflect ledger order", () => {
  const balance = calculateCashBalance([
    { type: "OPENING_BALANCE", amount: new Decimal("100") },
    { type: "DEPOSIT", amount: new Decimal("25.50") },
    { type: "WITHDRAWAL", amount: new Decimal("10") },
    { type: "ADJUSTMENT", amount: new Decimal("-2.50") },
  ], new Decimal("0"));
  assert.equal(balance.toString(), "113");

  const valuations = [
    { estimatedValue: new Decimal("125000"), effectiveAt: new Date("2026-01-01") },
    { estimatedValue: new Decimal("132500"), effectiveAt: new Date("2026-03-01") },
  ];
  const latest = [...valuations].sort(
    (left, right) => right.effectiveAt.getTime() - left.effectiveAt.getTime(),
  )[0];
  assert.equal(latest.estimatedValue.toString(), "132500");
});
