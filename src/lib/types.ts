export type Role = "admin" | "user";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  firebaseUid?: string;
  role: Role;
  balance: number;
  apiKey: string;
  createdAt: string;
};

export type PublicUser = Omit<User, "passwordHash" | "firebaseUid" | "apiKey">;

export type OrderRecord = {
  id: string;
  userId: string;
  providerOrderId: string;
  serviceId: number;
  serviceName: string;
  category: string;
  type: string;
  link: string;
  quantity: number;
  charge: number;
  cost?: number;
  currency: string;
  status: string;
  startCount: string;
  remains: string;
  refillId: string;
  createdAt: string;
  updatedAt: string;
};

export type Deposit = {
  id: string;
  userId: string;
  amount: number;
  method: string;
  reference: string;
  note: string;
  phone?: string;
  providerRef?: string;
  checkoutRequestId?: string;
  externalRef?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
};

export type TicketMessage = {
  from: "user" | "admin";
  body: string;
  at: string;
};

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  messages: TicketMessage[];
  status: "open" | "closed";
  createdAt: string;
};

export type Settings = {
  markup: number;
  depositNumber: string;
  depositInstructions: string;
};

export type DisabledService = {
  service: number;
  reason: string;
  at: string;
};

export type Store = {
  users: User[];
  orders: OrderRecord[];
  deposits: Deposit[];
  tickets: Ticket[];
  settings: Settings;
  disabledServices: DisabledService[];
  serviceCache: {
    at: number;
    currency: string;
    services: JeskieService[];
  } | null;
};

export type JeskieService = {
  service: number;
  name: string;
  type: string;
  category: string | null;
  rate: string;
  min: string;
  max: string;
  desc?: string;
  refill?: boolean;
  cancel?: boolean;
};

export type RetailService = Omit<JeskieService, "category" | "rate"> & {
  category: string;
  retailRate: number;
  wholesaleRate?: number;
  platform: PlatformId;
};

export type JeskieBalance = {
  balance: string;
  currency: string;
};

export type JeskieOrderStatus = {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string;
  currency?: string;
  error?: string;
};

export type PlatformId =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "telegram"
  | "spotify"
  | "linkedin"
  | "whatsapp"
  | "other";
