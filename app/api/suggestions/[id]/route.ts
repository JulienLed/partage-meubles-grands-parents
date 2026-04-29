import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const body = await req.json();
  if (typeof body.comment === "undefined") {
    return NextResponse.json({ error: "Le champ comment est requis" }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.findUnique({ where: { id } });
  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion non trouvée" }, { status: 404 });
  }

  const updated = await prisma.suggestion.update({
    where: { id },
    data: { comment: body.comment },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
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
