import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUser } from "@/lib/users";

export async function POST(req: Request) {
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

  if (Number(quantity) > item.quantity) {
    return NextResponse.json({ error: "Quantité supérieure au total de l'objet" }, { status: 400 });
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
