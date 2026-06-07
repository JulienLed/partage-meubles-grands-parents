import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.inventoryItem.delete({ where: { id: Number(id) } });
  } catch (err) {
    console.error(`[DELETE /api/items/${id}] failed:`, err);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
