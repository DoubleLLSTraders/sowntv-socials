import { OrderTracker } from "./order-tracker";

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  return <OrderTracker id={id} />;
}
