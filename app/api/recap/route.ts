import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ItemMeta {
  quantity: number;
  totalDemanded: number;
  itemInfo: { id: number; name: string; quantity: number };
  demands: { suggestedBy: string; quantity: number }[];
}

export async function GET(_req: Request) {
  const suggestions = await prisma.suggestion.findMany({
    include: { inventoryItem: true },
    orderBy: { createdAt: "asc" },
  });

  const itemMeta: Record<number, ItemMeta> = {};

  for (const s of suggestions) {
    if (!itemMeta[s.inventoryItemId]) {
      itemMeta[s.inventoryItemId] = {
        quantity: s.inventoryItem.quantity,
        totalDemanded: 0,
        itemInfo: { id: s.inventoryItem.id, name: s.inventoryItem.name, quantity: s.inventoryItem.quantity },
        demands: [],
      };
    }
    itemMeta[s.inventoryItemId].totalDemanded += s.quantity;
    itemMeta[s.inventoryItemId].demands.push({ suggestedBy: s.suggestedBy, quantity: s.quantity });
  }

  // Groupement par personne avec hasConflict = sum(qty) > item.quantity
  const byPerson: Record<string, unknown[]> = {};

  for (const s of suggestions) {
    if (!byPerson[s.suggestedBy]) byPerson[s.suggestedBy] = [];

    const meta = itemMeta[s.inventoryItemId];
    const hasConflict = meta.totalDemanded > meta.quantity;

    byPerson[s.suggestedBy].push({ ...s, hasConflict });
  }

  // Nombre d'items distincts en situation de conflit
  const conflictCount = Object.values(itemMeta).filter(
    (m) => m.totalDemanded > m.quantity
  ).length;

  // Section "Objets à départager"
  const conflicts = Object.values(itemMeta)
    .filter((m) => m.totalDemanded > m.quantity)
    .map((m) => ({
      item: m.itemInfo,
      totalDemanded: m.totalDemanded,
      demands: m.demands,
    }));

  return NextResponse.json({ byPerson, conflictCount, conflicts });
}
