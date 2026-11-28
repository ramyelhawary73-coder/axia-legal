import { handlePush, pushResponse } from "@/lib/push-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
export async function GET(request: Request, context: Context) {
  const { action } = await context.params;
  return action === "config" ? handlePush(request, action) : pushResponse({ code: "PUSH_NOT_FOUND" }, 404);
}
export async function POST(request: Request, context: Context) {
  const { action } = await context.params;
  return ["device", "test"].includes(action) ? handlePush(request, action) : pushResponse({ code: "PUSH_NOT_FOUND" }, 404);
}
export async function DELETE(request: Request, context: Context) {
  const { action } = await context.params;
  return action === "device" ? handlePush(request, action) : pushResponse({ code: "PUSH_NOT_FOUND" }, 404);
}
