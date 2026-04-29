import { VideoBackground } from "@/components/VideoBackground";
import { SuggestClient } from "./SuggestClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuggestPage() {
  const items = await prisma.inventoryItem.findMany({
    include: { suggestions: true },
    orderBy: { id: "asc" },
  });

  const enrichedItems = items.map((item) => ({ ...item }));

  return (
    <>
      <VideoBackground />
      <SuggestClient items={enrichedItems} />
    </>
  );
}
