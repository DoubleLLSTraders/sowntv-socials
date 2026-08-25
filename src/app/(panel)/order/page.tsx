import { Suspense } from "react";
import { OrderForm } from "./order-form";

export default function OrderPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading order form...</p>}>
      <OrderForm />
    </Suspense>
  );
}
