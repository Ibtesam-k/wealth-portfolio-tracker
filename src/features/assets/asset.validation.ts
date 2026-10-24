import type { AssetTransactionType, AssetType } from "@/generated/prisma/client";

const supportedCurrencyCodes = new Set(Intl.supportedValuesOf("currency"));

export type AssetInput = {
  name: string;
  type: AssetType;
  currency: string;
  symbol?: string;
  currentPrice?: string;
  initialBuy?: {
    type: "BUY";
    quantity: string;
    unitPrice: string;
    occurredAt: Date;
    note?: string;
  };
  openingBalance?: {
    type: "OPENING_BALANCE";
    amount: string;
    occurredAt: Date;
    note?: string;
  };
  initialValuation?: {
    estimatedValue: string;
    effectiveAt: Date;
    note?: string;
  };
};

export type AssetValidation =
  | { success: true; data: AssetInput }
  | { success: false; error: string };

export type LedgerTransactionInput = {
  type: AssetTransactionType;
  occurredAt: Date;
  note?: string;
  quantity?: string;
  unitPrice?: string;
  amount?: string;
};

export function isDecimalString(value: unknown, allowSigned = false): value is string {
  return (
    typeof value === "string" &&
    (allowSigned
      ? /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)
      : /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value))
  );
}

function fitsDecimal(value: string, precision: number, scale: number) {
  const unsigned = value.replace(/^-/, "");
  const [whole, fraction = ""] = unsigned.split(".");
  return whole.length <= precision - scale && fraction.length <= scale;
}

export function isPositiveDecimalString(
  value: unknown,
  precision = 48,
  scale = 18,
): value is string {
  return (
    isDecimalString(value) &&
    /[1-9]/.test(value) &&
    fitsDecimal(value, precision, scale)
  );
}

export function validateAssetInput(input: unknown): AssetValidation {
  if (typeof input !== "object" || input === null) {
    return { success: false, error: "A JSON object is required" };
  }

  const value = input as Record<string, unknown>;
  if (typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 100) {
    return { success: false, error: "Name must be between 1 and 100 characters" };
  }

  if (!["STOCK", "CRYPTO", "CASH", "REAL_ESTATE"].includes(String(value.type))) {
    return { success: false, error: "A supported asset type is required" };
  }

  const type = value.type as AssetType;
  const currency = value.currency === undefined ? "USD" : value.currency;
  if (
    typeof currency !== "string" ||
    !/^[A-Z]{3}$/.test(currency) ||
    !supportedCurrencyCodes.has(currency)
  ) {
    return { success: false, error: "Currency must be a 3-letter uppercase ISO code" };
  }

  const hasSymbol = value.symbol !== undefined;
  const hasCurrentPrice = value.currentPrice !== undefined;
  if (
    ((type !== "STOCK" && type !== "CRYPTO") && value.initialBuy !== undefined) ||
    (type !== "CASH" && value.openingBalance !== undefined) ||
    (type !== "REAL_ESTATE" && value.initialValuation !== undefined)
  ) {
    return { success: false, error: "Initial financial record does not match the asset type" };
  }

  let initialBuy: AssetInput["initialBuy"];
  let openingBalance: AssetInput["openingBalance"];
  let initialValuation: AssetInput["initialValuation"];

  if (type === "STOCK" || type === "CRYPTO") {
    if (
      !hasSymbol ||
      typeof value.symbol !== "string" ||
      !value.symbol.trim() ||
      value.symbol.trim().length > 32
    ) {
      return { success: false, error: "A symbol of 1 to 32 characters is required" };
    }
    if (!hasCurrentPrice || !isPositiveDecimalString(value.currentPrice, 20, 8)) {
      return { success: false, error: "Current price must be a positive decimal string" };
    }
    if (value.initialBuy === undefined) {
      return { success: false, error: "An initial BUY with quantity and unit price is required" };
    }
    const initialBuyValidation = validateLedgerTransaction(type, {
      ...(typeof value.initialBuy === "object" && value.initialBuy !== null
        ? value.initialBuy
        : {}),
      type: "BUY",
    });
    if (!initialBuyValidation.success) {
      return {
        success: false,
        error: `Initial BUY: ${initialBuyValidation.error}`,
      };
    }
    initialBuy = {
      type: "BUY",
      quantity: initialBuyValidation.data.quantity!,
      unitPrice: initialBuyValidation.data.unitPrice!,
      occurredAt: initialBuyValidation.data.occurredAt,
      ...(initialBuyValidation.data.note
        ? { note: initialBuyValidation.data.note }
        : {}),
    };
  } else if (hasSymbol || hasCurrentPrice) {
    return { success: false, error: "Symbol and current price are only valid for tradable assets" };
  }

  if (type === "CASH") {
    if (value.openingBalance === undefined) {
      return { success: false, error: "A positive opening balance is required" };
    }
    const openingBalanceValidation = validateLedgerTransaction(type, {
      ...(typeof value.openingBalance === "object" && value.openingBalance !== null
        ? value.openingBalance
        : {}),
      type: "OPENING_BALANCE",
    });
    if (!openingBalanceValidation.success) {
      return {
        success: false,
        error: `Opening balance: ${openingBalanceValidation.error}`,
      };
    }
    openingBalance = {
      type: "OPENING_BALANCE",
      amount: openingBalanceValidation.data.amount!,
      occurredAt: openingBalanceValidation.data.occurredAt,
      ...(openingBalanceValidation.data.note
        ? { note: openingBalanceValidation.data.note }
        : {}),
    };
  }

  if (type === "REAL_ESTATE") {
    if (typeof value.initialValuation !== "object" || value.initialValuation === null) {
      return { success: false, error: "An initial positive valuation is required" };
    }
    const initial = value.initialValuation as Record<string, unknown>;
    if (!isPositiveDecimalString(initial.estimatedValue, 38, 18)) {
      return { success: false, error: "Initial valuation must be a positive decimal string" };
    }
    const effectiveAt = initial.effectiveAt === undefined
      ? new Date()
      : new Date(String(initial.effectiveAt));
    if (Number.isNaN(effectiveAt.getTime())) {
      return { success: false, error: "Initial valuation effectiveAt must be a valid date" };
    }
    if (initial.note !== undefined && (typeof initial.note !== "string" || initial.note.length > 500)) {
      return { success: false, error: "Initial valuation note must be 500 characters or fewer" };
    }
    initialValuation = {
      estimatedValue: initial.estimatedValue,
      effectiveAt,
      ...(typeof initial.note === "string" && initial.note ? { note: initial.note } : {}),
    };
  }

  return {
    success: true,
    data: {
      name: value.name.trim(),
      type,
      currency,
      ...(type === "STOCK" || type === "CRYPTO"
        ? { symbol: (value.symbol as string).trim(), currentPrice: value.currentPrice as string }
        : {}),
      ...(initialBuy ? { initialBuy } : {}),
      ...(openingBalance ? { openingBalance } : {}),
      ...(initialValuation ? { initialValuation } : {}),
    },
  };
}

export function validateLedgerTransaction(
  assetType: AssetType,
  input: unknown,
): { success: true; data: LedgerTransactionInput } | { success: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { success: false, error: "A JSON object is required" };
  }

  const value = input as Record<string, unknown>;
  const tradable = assetType === "STOCK" || assetType === "CRYPTO";
  const allowedTypes = tradable ? ["BUY", "SELL"] : assetType === "CASH"
    ? ["OPENING_BALANCE", "DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"]
    : [];

  if (!allowedTypes.includes(String(value.type))) {
    return { success: false, error: "Transaction type is not valid for this asset" };
  }

  const occurredAt = value.occurredAt === undefined ? new Date() : new Date(String(value.occurredAt));
  if (Number.isNaN(occurredAt.getTime())) {
    return { success: false, error: "A valid occurrence date is required" };
  }

  if (tradable) {
    if (
      !isPositiveDecimalString(value.quantity, 28, 10) ||
      !isPositiveDecimalString(value.unitPrice, 20, 8) ||
      value.amount !== undefined
    ) {
      return { success: false, error: "BUY and SELL require positive quantity and unit price only" };
    }
    return {
      success: true,
      data: {
        type: value.type as AssetTransactionType,
        occurredAt,
        ...(typeof value.note === "string" ? { note: value.note } : {}),
        quantity: value.quantity,
        unitPrice: value.unitPrice,
      },
    };
  }

  const cashType = value.type as AssetTransactionType;
  const signedAdjustment = cashType === "ADJUSTMENT";
  if (
    !isDecimalString(value.amount, signedAdjustment) ||
    !fitsDecimal(value.amount, 48, 18) ||
    (!signedAdjustment && !isPositiveDecimalString(value.amount, 48, 18)) ||
    value.quantity !== undefined ||
    value.unitPrice !== undefined
  ) {
    return { success: false, error: "Cash transactions require a valid amount only" };
  }

  return {
    success: true,
    data: {
      type: cashType,
      occurredAt,
      ...(typeof value.note === "string" ? { note: value.note } : {}),
      amount: value.amount,
    },
  };
}