import { platformRead } from "@/lib/api/platform";
export async function GET(request: Request) { return platformRead(request, "audit"); }
