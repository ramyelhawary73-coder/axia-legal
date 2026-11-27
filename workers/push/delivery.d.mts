export type SubscriptionRecord = { endpoint: string; expirationTime: number | null; keys: { p256dh: string; auth: string } };
export type PushBinding = { scope: string; deviceId: string; userId: string; organizationId: string; sessionId: string; origin: string };
export function validateSubscription(value: unknown): SubscriptionRecord;
export function sealSubscription(subscription: unknown, binding: PushBinding, key: string): string;
export function endpointHash(subscription: unknown, key: string): string;
export function derivePushKey(key: string, purpose: "subscription" | "endpoint" | "csrf"): Uint8Array<ArrayBuffer>;
