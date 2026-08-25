export function normalizeMpesaReceipt(raw?: string) {
  const value = (raw || "").replace(/\s+/g, "").toUpperCase();
  if (/^[A-Z][A-Z0-9]{8,11}$/.test(value)) return value;
  return "";
}

export function extractMpesaCode(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "object") {
    const payload = input as Record<string, unknown>;
    const direct = [
      payload.providerReference,
      payload.provider_reference,
      payload.MpesaReceiptNumber,
      payload.mpesa_receipt,
      payload.receipt,
      payload.third_party_reference,
    ]
      .map((value) => normalizeMpesaReceipt(String(value || "")))
      .find(Boolean);
    if (direct) return direct;
  }
  const text = typeof input === "string" ? input : JSON.stringify(input);
  const match = text.toUpperCase().match(/\b[A-Z][A-Z0-9]{9}\b/);
  return match?.[0] || "";
}
