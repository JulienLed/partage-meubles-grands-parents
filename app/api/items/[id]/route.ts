import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { description } = await req.json();

  try {
    const item = await prisma.inventoryItem.update({
      where: { id: Number(id) },
      data: { description },
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error(`[PATCH /api/items/${id}] failed:`, err);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
