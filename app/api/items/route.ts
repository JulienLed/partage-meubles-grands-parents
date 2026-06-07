import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
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

  return NextResponse.json({ items: enrichedItems });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, quantity, notes, photoUrl, addedVia } = body;

  if (!name || !quantity) {
    return NextResponse.json({ error: "name et quantity sont requis" }, { status: 400 });
  }

  let item;
  try {
    item = await prisma.inventoryItem.create({
      data: {
        name,
        description: description ?? null,
        quantity: Number(quantity),
        notes: notes ?? null,
        photoUrl: photoUrl ?? null,
        addedVia: addedVia ?? "manual",
      },
    });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      console.error(`[POST /api/items] nom déjà existant: "${name}"`);
      return NextResponse.json({ error: "Un objet porte déjà ce nom" }, { status: 409 });
    }
    console.error(
      `[POST /api/items] prisma.create failed for "${name}" (photoUrl="${photoUrl ?? "null"}"):`,
      err
    );
    return NextResponse.json({ error: "Erreur lors de la création de l'objet" }, { status: 500 });
  }

  return NextResponse.json(item, { status: 201 });
}
