import { readOnly, withStore } from "./db";
import {
  isPayheroFailed,
  isPayheroSuccess,
  listPayheroTransactions,
  lookupPayheroStatus,
  normalizeMpesaReceipt,
  receiptFromStatus,
  transactionMatchesDeposit,
  transactionReceipt,
  type PayheroStatus,
  type PayheroTxn,
} from "./payhero";
import type { Deposit } from "./types";

export type SettleHints = {
  receipt?: string;
  reference?: string;
};

function usedReceipts(store: { deposits: Deposit[] }, exceptId?: string) {
  return new Set(
    store.deposits
      .filter((item) => item.status === "approved" && item.id !== exceptId)
      .flatMap((item) => [item.reference, item.providerRef, item.externalRef])
      .filter(Boolean),
  );
}

function applyApproved(row: Deposit, receipt?: string, providerRef?: string) {
  if (row.status === "approved") {
    if (receipt) row.reference = receipt;
    if (providerRef) row.providerRef = providerRef;
    return row;
  }
  if (row.status === "rejected") return row;
  row.status = "approved";
  row.reference = receipt || row.reference;
  if (providerRef) row.providerRef = providerRef;
  row.resolvedAt = new Date().toISOString();
  return row;
}

async function creditIfNew(depositId: string, receipt?: string, providerRef?: string) {
  return withStore((store) => {
    const row = store.deposits.find((item) => item.id === depositId);
    if (!row) return null;
    if (row.status === "approved") return applyApproved(row, receipt, providerRef);
    const token = receipt || providerRef || "";
    if (token && usedReceipts(store, row.id).has(token)) return row;
    applyApproved(row, receipt, providerRef);
    const user = store.users.find((item) => item.id === row.userId);
    if (user) user.balance = Number((user.balance + row.amount).toFixed(4));
    return row;
  });
}

function isApiPaymentRef(value: string) {
  return Boolean(normalizeMpesaReceipt(value) || /^ws_/i.test(value));
}

async function applyRemote(deposit: Deposit, remote: PayheroStatus | null, lookup: string) {
  if (!remote) return null;
  if (isPayheroSuccess(remote.status, remote.success)) {
    const row = await creditIfNew(
      deposit.id,
      normalizeMpesaReceipt(receiptFromStatus(remote)) || receiptFromStatus(remote) || lookup,
      remote.reference || remote.CheckoutRequestID,
    );
    return row?.status === "approved" ? row : null;
  }
  if (isPayheroFailed(remote.status) && isApiPaymentRef(lookup)) {
    return withStore((store) => {
      const row = store.deposits.find((item) => item.id === deposit.id);
      if (!row || row.status !== "pending") return row || null;
      row.status = "rejected";
      row.resolvedAt = new Date().toISOString();
      return row;
    });
  }
  return null;
}

function logSettleAttempt(deposit: Deposit, transactions: PayheroTxn[], matched: boolean, error?: string) {
  if (process.env.NODE_ENV === "production") return;
  const sample = transactions.slice(0, 6).map((txn) => ({
    amount: txn.amount,
    kind: txn.transaction_type || txn.transaction_name || "",
    at: txn.created_at || "",
  }));
  console.log(
    "[payhero] settle",
    JSON.stringify({
      deposit: deposit.id.slice(0, 8),
      amount: deposit.amount,
      transactions: transactions.length,
      matched,
      error: error || null,
      sample,
    }),
  );
}

function lookupKeys(deposit: Deposit, hints: SettleHints) {
  const id = deposit.id;
  return [
    normalizeMpesaReceipt(hints.receipt),
    hints.receipt,
    hints.reference,
    deposit.externalRef,
    deposit.providerRef,
    deposit.checkoutRequestId,
    deposit.reference,
    id,
    id.slice(0, 13),
    id.replace(/-/g, "").slice(0, 12),
  ].filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index);
}

export async function settleDepositFromPayhero(deposit: Deposit, hints: SettleHints = {}): Promise<Deposit> {
  if (deposit.status === "approved" || deposit.status === "rejected") return deposit;

  for (const lookup of lookupKeys(deposit, hints)) {
    const credited = await applyRemote(deposit, await lookupPayheroStatus(lookup), lookup);
    if (credited) return credited;
  }

  const { transactions, error } = await listPayheroTransactions();
  const mpesa = normalizeMpesaReceipt(hints.receipt);
  const taken = await readOnly((store) => usedReceipts(store));
  const match = transactions.find((txn) => {
    const receipt = normalizeMpesaReceipt(transactionReceipt(txn)) || transactionReceipt(txn);
    if (receipt && taken.has(receipt)) return false;
    if (mpesa && receipt.toUpperCase() === mpesa) return true;
    return transactionMatchesDeposit(txn, deposit);
  });
  logSettleAttempt(deposit, transactions, Boolean(match), error);
  if (match) {
    const receipt = normalizeMpesaReceipt(transactionReceipt(match)) || transactionReceipt(match);
    const remote = receipt ? await lookupPayheroStatus(receipt) : null;
    if (remote) {
      const credited = await applyRemote(deposit, remote, receipt);
      if (credited) return credited;
    }
    const unique = receipt || mpesa || `payhero-${match.id || deposit.id}`;
    return (await creditIfNew(deposit.id, unique, match.reference || String(match.id || ""))) || deposit;
  }

  return readOnly((store) => store.deposits.find((item) => item.id === deposit.id) || deposit);
}

export async function settleDepositByReference(externalRef: string, receipt?: string) {
  const deposit = await readOnly(
    (store) =>
      store.deposits.find((item) => item.id === externalRef || item.externalRef === externalRef) || null,
  );
  if (!deposit) return null;
  if (deposit.status === "approved") {
    if (receipt) {
      await withStore((store) => {
        const row = store.deposits.find((item) => item.id === deposit.id);
        if (row && receipt) row.reference = receipt;
      });
    }
    return deposit;
  }
  return settleDepositFromPayhero(deposit, { receipt, reference: externalRef });
}

export async function settlePendingDeposits(userId: string) {
  const pending = await readOnly((store) =>
    store.deposits.filter((item) => item.userId === userId && item.status === "pending"),
  );
  const credited: Deposit[] = [];
  let error: string | undefined;
  for (const deposit of pending) {
    try {
      const updated = await settleDepositFromPayhero(deposit);
      if (updated.status === "approved") credited.push(updated);
    } catch (failure) {
      error = failure instanceof Error ? failure.message : "PayHero is unavailable.";
    }
  }
  if (!credited.length && pending.length && !error) {
    const probe = await listPayheroTransactions();
    if (probe.error) error = probe.error;
  }
  return { credited, error };
}
