import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const user = new URL(req.url).searchParams.get("user");
  if (!user) {
    return NextResponse.json({ error: "Le param ?user est requis" }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.findUnique({ where: { id } });

  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion non trouvée" }, { status: 404 });
  }

  if (suggestion.suggestedBy !== user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.suggestion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
