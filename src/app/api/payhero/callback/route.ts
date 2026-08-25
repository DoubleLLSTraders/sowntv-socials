import { NextRequest } from "next/server";
import { settleDepositByReference } from "@/lib/deposits";

type CallbackBody = {
  reference?: string;
  user_reference?: string;
  providerReference?: string;
  response?: {
    Amount?: number;
    CheckoutRequestID?: string;
    ExternalReference?: string;
    MpesaReceiptNumber?: string;
    ResultCode?: number;
    ResultDesc?: string;
    Status?: string;
  };
};

async function settleFromPayload(body: CallbackBody) {
  const response = body.response;
  const external = response?.ExternalReference || body.user_reference || body.reference || "";
  if (!external) return;
  const receipt = response?.MpesaReceiptNumber || body.providerReference || "";
  await settleDepositByReference(external, receipt || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CallbackBody;
    await settleFromPayload(body);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}

export async function GET() {
  return Response.json({ ok: true });
}
