import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUser } from "@/lib/users";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { inventoryItemId, suggestedBy, quantity = 1, comment } = body;

  if (!inventoryItemId || !suggestedBy) {
    return NextResponse.json({ error: "inventoryItemId et suggestedBy sont requis" }, { status: 400 });
  }
  if (!isValidUser(suggestedBy)) {
    return NextResponse.json({ error: "Utilisateur non autorisé" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id: Number(inventoryItemId) },
    include: { suggestions: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Item non trouvé" }, { status: 404 });
  }

  const totalSuggested = item.suggestions.reduce((sum, s) => sum + s.quantity, 0);
  const availableQty = item.quantity - totalSuggested;

  if (availableQty <= 0 || Number(quantity) > availableQty) {
    return NextResponse.json({ error: "Stock insuffisant" }, { status: 409 });
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      inventoryItemId: Number(inventoryItemId),
      suggestedBy,
      quantity: Number(quantity),
      comment: comment ?? null,
    },
  });

  return NextResponse.json(suggestion, { status: 201 });
}
