import { platformError, platformJson, resolvePlatformContext } from "@/lib/api/platform";

export async function GET() {
  const context = await resolvePlatformContext(true);
  return context.ok ? platformJson({ state: context.state }) : platformError(context.code);
}
