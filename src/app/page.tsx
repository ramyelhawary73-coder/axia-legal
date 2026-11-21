import { redirect } from "next/navigation";
import OfficeWorkspace from "@/components/office-workspace";
import { resolvePlatformContext } from "@/lib/api/platform";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { workspace } = await searchParams;
  // Navigation only: the existing server/RPC guards remain the source of authority.
  // Explicit office navigation retains the current user's own membership checks.
  if (workspace !== "1") {
    const platform = await resolvePlatformContext(true);
    if (platform.ok) redirect("/platform");
  }
  return <OfficeWorkspace />;
}
