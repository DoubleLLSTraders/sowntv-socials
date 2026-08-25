import type { OrderRecord, RetailService, Role, User } from "./types";

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    balance: user.balance,
    createdAt: user.createdAt,
  };
}

export function publicOrder(order: OrderRecord, role: Role) {
  if (role === "admin") return order;
  return {
    id: order.id,
    userId: order.userId,
    providerOrderId: order.providerOrderId,
    serviceId: order.serviceId,
    serviceName: order.serviceName,
    category: order.category,
    type: order.type,
    link: order.link,
    quantity: order.quantity,
    charge: order.charge,
    currency: order.currency,
    status: order.status,
    startCount: order.startCount,
    remains: order.remains,
    refillId: order.refillId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function publicService(service: RetailService, role: Role) {
  const base = {
    service: service.service,
    name: service.name,
    type: service.type,
    category: service.category,
    min: service.min,
    max: service.max,
    refill: service.refill,
    cancel: service.cancel,
    desc: service.desc || "",
    retailRate: service.retailRate,
    platform: service.platform,
  };
  if (role !== "admin") return base;
  return {
    ...base,
    wholesaleRate: service.wholesaleRate,
  };
}
