import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  console.log(
    `[POST /api/upload] fichier reçu: name="${file.name}" size=${file.size} type="${file.type}"`
  );

  let blob;
  try {
    blob = await put(file.name, file, { access: "public" });
  } catch (err) {
    console.error(
      `[POST /api/upload] put() failed for "${file.name}" (size=${file.size}, type="${file.type}"):`,
      err
    );
    return NextResponse.json({ error: "Échec de l'upload de la photo" }, { status: 500 });
  }

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
