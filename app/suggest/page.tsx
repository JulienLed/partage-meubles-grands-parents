import { VideoBackground } from "@/components/VideoBackground";
import { SuggestClient } from "./SuggestClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuggestPage() {
  const items = await prisma.inventoryItem.findMany({
    include: { suggestions: true },
    orderBy: { id: "asc" },
  });

  const enrichedItems = items.map((item) => {
    const totalSuggested = item.suggestions.reduce((sum, s) => sum + s.quantity, 0);
    const availableQty = item.quantity - totalSuggested;
    const uniqueSuggestedBy = new Set(item.suggestions.map((s) => s.suggestedBy));
    const hasConflict = item.quantity === 1 && uniqueSuggestedBy.size >= 2;
    return { ...item, availableQty, hasConflict };
  });

  return (
    <>
      <VideoBackground />
      <SuggestClient items={enrichedItems} />
    </>
  );
}
