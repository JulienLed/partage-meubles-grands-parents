import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suggestions = await prisma.suggestion.findMany({
    include: { inventoryItem: true },
    orderBy: { createdAt: "asc" },
  });

  // Calcule pour chaque item : quantity et ensemble des suggestedBy
  const itemMeta: Record<number, { quantity: number; suggestedBy: Set<string> }> = {};

  for (const s of suggestions) {
    if (!itemMeta[s.inventoryItemId]) {
      itemMeta[s.inventoryItemId] = {
        quantity: s.inventoryItem.quantity,
        suggestedBy: new Set(),
      };
    }
    itemMeta[s.inventoryItemId].suggestedBy.add(s.suggestedBy);
  }

  // Groupement par personne avec hasConflict sur chaque suggestion
  const byPerson: Record<string, unknown[]> = {};

  for (const s of suggestions) {
    if (!byPerson[s.suggestedBy]) byPerson[s.suggestedBy] = [];

    const meta = itemMeta[s.inventoryItemId];
    const hasConflict = meta.quantity === 1 && meta.suggestedBy.size >= 2;

    byPerson[s.suggestedBy].push({ ...s, hasConflict });
  }

  // Nombre d'items distincts en situation de conflit
  const conflictCount = Object.values(itemMeta).filter(
    (m) => m.quantity === 1 && m.suggestedBy.size >= 2
  ).length;

  return NextResponse.json({ byPerson, conflictCount });
}
