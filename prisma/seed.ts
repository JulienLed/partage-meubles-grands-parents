import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.suggestion.deleteMany()
  await prisma.inventoryItem.deleteMany()

  const items = [
    {
      name: "Lit double",
      quantity: 1,
      photoUrl: "/Lit double.jpg",
      addedVia: "seed",
    },
    {
      name: "Garde-robe",
      quantity: 1,
      photoUrl: "/Garde-robe.jpg",
      addedVia: "seed",
    },
    {
      name: "Table de nuit",
      quantity: 2,
      description: "Voir photo à gauche du lit",
      photoUrl: null,
      addedVia: "seed",
    },
    {
      name: "Vitrine en coin",
      quantity: 1,
      photoUrl: "/Vitrine en coin.jpg",
      addedVia: "seed",
    },
    {
      name: "Buffet à 4 tiroirs",
      quantity: 1,
      photoUrl: "/Buffet à 4 tiroirs.jpg",
      addedVia: "seed",
    },
    {
      name: "Petite table en marbre",
      quantity: 1,
      photoUrl: "/Petite table en marbre.jpg",
      addedVia: "seed",
    },
    {
      name: "Petite table en bois",
      quantity: 1,
      photoUrl: "/Petite table en bois.jpg",
      addedVia: "seed",
    },
    {
      name: "Grande armoire",
      quantity: 1,
      description: "H200 × L180 × P60 cm",
      photoUrl: "/Grande Armoire.jpg",
      addedVia: "seed",
    },
    {
      name: "Buffet noyer",
      quantity: 1,
      description: "H99 × L89 × P51 cm",
      photoUrl: "/Buffet noyer.jpg",
      addedVia: "seed",
    },
    {
      name: "Buffet 2 portes",
      quantity: 1,
      description: "H99 × L130 × P56 cm",
      photoUrl: "/Buffet 2 portes.jpg",
      addedVia: "seed",
    },
    {
      name: "Petite armoire ronde",
      quantity: 1,
      photoUrl: "/Petite armoire ronde.jpg",
      addedVia: "seed",
    },
    {
      name: "Grande bibliothèque",
      quantity: 1,
      description: "H199 × L174 × P47 cm",
      photoUrl: "/Grande bibliothèque.jpg",
      addedVia: "seed",
    },
    {
      name: "Petite table de couture",
      quantity: 1,
      photoUrl: "/Petite table de couture.jpg",
      addedVia: "seed",
    },
    {
      name: "Bureau de Papa",
      quantity: 1,
      photoUrl: "/Bureau de Papa.jpg",
      addedVia: "seed",
    },
    {
      name: "Armoire assortie au bureau",
      quantity: 1,
      photoUrl: "/Armoire assortie au bureau.jpg",
      addedVia: "seed",
    },
    {
      name: "Cabriolets de Mamy",
      quantity: 1,
      photoUrl: "/Cabriolets de Mamy.jpg",
      addedVia: "seed",
    },
    {
      name: "Bureau chambre de Pierre",
      quantity: 1,
      photoUrl: "/Bureau chambre de Pierre.jpg",
      addedVia: "seed",
    },
    {
      name: "Bureau de la secrétaire",
      quantity: 1,
      photoUrl: "/Bureau de la secrétaire.jpg",
      addedVia: "seed",
    },
    {
      name: "Chaises (lot de 6)",
      quantity: 6,
      photoUrl: "/chaises.jpg",
      addedVia: "seed",
    },
    {
      name: "Chaises salle à manger — modèle A",
      quantity: 2,
      photoUrl: "/Chaises de la salle à manger.jpg",
      addedVia: "seed",
    },
    {
      name: "Chaises salle à manger — modèle B",
      quantity: 2,
      photoUrl: "/Chaises de la salle à manger.jpg",
      addedVia: "seed",
    },
    {
      name: "Table ronde avec 2 rallonges",
      quantity: 1,
      description: "L170 × l120 cm (photo avec 1 rallonge)",
      photoUrl: "/Table ronde avec 2 rallonges.jpg",
      addedVia: "seed",
    },
    {
      name: "Plateaux en porcelaine cerclés argent",
      quantity: 2,
      photoUrl: "/plateaux en porcelaine cerclés argent.jpg",
      addedVia: "seed",
    },
    {
      name: "Fauteuil 3 places salon",
      quantity: 1,
      description: "L210 cm",
      photoUrl: "/Fauteuil 3 places salon.jpg",
      addedVia: "seed",
    },
    {
      name: "Fauteuil stress-less avec repose-pied",
      quantity: 2,
      photoUrl: "/stress-less avec repose pied.jpg",
      addedVia: "seed",
    },
    {
      name: "Vélo d'intérieur",
      quantity: 1,
      photoUrl: "/Vélo d'intérieur.jpg",
      addedVia: "seed",
    },
    {
      name: "Table en formica gris",
      quantity: 1,
      description: "Avec 1 chaise et 1 tabouret",
      photoUrl: "/Table en formica gris avec une chaise et un tabouret.jpg",
      addedVia: "seed",
    },
    {
      name: "Table gigogne grande",
      quantity: 1,
      description: "70 cm",
      photoUrl: "/Tables gigognes en plastique.jpg",
      addedVia: "seed",
    },
    {
      name: "Tables gigognes petites",
      quantity: 3,
      description: "46 cm chacune",
      photoUrl: "/Tables gigognes en plastique.jpg",
      addedVia: "seed",
    },
    {
      name: "Chaise de baignoire",
      quantity: 1,
      photoUrl: "/Chaise de baignoire.jpg",
      addedVia: "seed",
    },
    {
      name: "Porte-manteau perroquet",
      quantity: 1,
      photoUrl: "/Porte manteau perroquet.jpg",
      addedVia: "seed",
    },
    {
      name: "Colonne en marbre blanc",
      quantity: 1,
      photoUrl: "/Colonne en marbre blanc.jpg",
      addedVia: "seed",
    },
    {
      name: "Colonne en marbre blanc veiné noir",
      quantity: 1,
      photoUrl: "/Colonne en marbre blanc veiné noir.jpg",
      addedVia: "seed",
    },
    {
      name: "Douille d'obus",
      quantity: 1,
      photoUrl: "/Douille d'obus.jpg",
      addedVia: "seed",
    },
    {
      name: "Vélos de femme",
      quantity: 2,
      description: "1 à la cave, 1 au garage",
      photoUrl: "/vélos de femme.jpg",
      addedVia: "seed",
    },
    {
      name: "Vieux vélo de Papa",
      quantity: 1,
      photoUrl: null,
      addedVia: "seed",
    },
    {
      name: "Télévision",
      quantity: 1,
      description: "106 cm",
      photoUrl: null,
      addedVia: "seed",
    },
    {
      name: "Chaîne hi-fi",
      quantity: 1,
      photoUrl: null,
      addedVia: "seed",
    },
  ]

  for (const item of items) {
    await prisma.inventoryItem.create({ data: item })
  }

  console.log(`✅ ${items.length} objets seedés`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
