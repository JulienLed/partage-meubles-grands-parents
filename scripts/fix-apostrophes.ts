import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

// U+0027 = apostrophe droite (ASCII)    '
// U+2019 = guillemet apostrophe courbe  '
const STRAIGHT = "'";
const CURLY    = "’";

async function main() {
  console.log("=== Correction des apostrophes dans photoUrl ===\n");

  // Trouver les items par nom (insensible à l'apostrophe)
  const allItems = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { name: { contains: "Douille" } },
        { name: { contains: "int" } }, // "intérieur" dans "Vélo d'intérieur"
      ],
    },
    select: { id: true, name: true, photoUrl: true },
  });

  // Filtrer ceux qui ont une apostrophe droite dans photoUrl
  const toFix = allItems.filter(
    (item) => item.photoUrl && item.photoUrl.includes(STRAIGHT)
  );

  if (toFix.length === 0) {
    console.log("✅ Aucune correction nécessaire — toutes les photoUrl utilisent déjà l'apostrophe correcte.");
    console.log("\nÉtat actuel :");
    for (const item of allItems) {
      if (item.photoUrl?.includes("obus") || item.photoUrl?.includes("rieur")) {
        const code = item.photoUrl
          ? "U+" + ([...item.photoUrl].find((c) => c === STRAIGHT || c === CURLY)?.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")
          : "—";
        console.log(`  [${item.id}] ${item.name} | photoUrl: "${item.photoUrl}" | apostrophe: ${code}`);
      }
    }
    return;
  }

  for (const item of toFix) {
    const newUrl = item.photoUrl!.replaceAll(STRAIGHT, CURLY);
    console.log(`📝 [${item.id}] ${item.name}`);
    console.log(`   Avant : "${item.photoUrl}"`);
    console.log(`   Après : "${newUrl}"`);

    // update par ID — pas de transaction, compatiblement HTTP
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { photoUrl: newUrl },
    });
    console.log(`   ✅ Mis à jour\n`);
  }

  // Vérification finale
  console.log("=== Vérification finale ===\n");
  const final = await prisma.inventoryItem.findMany({
    where: { id: { in: toFix.map((i) => i.id) } },
    select: { id: true, name: true, photoUrl: true },
  });
  for (const item of final) {
    const hasCorrectApostrophe = item.photoUrl?.includes(CURLY) ?? false;
    const hasStraight = item.photoUrl?.includes(STRAIGHT) ?? false;
    console.log(`  [${item.id}] ${item.name}`);
    console.log(`    photoUrl : "${item.photoUrl}"`);
    console.log(`    apostrophe courbe : ${hasCorrectApostrophe ? "✅" : "❌"} | apostrophe droite : ${hasStraight ? "⚠️ encore présente" : "✅ absente"}\n`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
