# partage-meubles-grands-parents

App familiale Next.js de partage de meubles suite à un décès. Les membres de la famille parcourent l'inventaire et expriment leur intérêt pour des objets.

## Stack
- Next.js + TypeScript, App Router
- Prisma 7 (ESM) + Neon PostgreSQL — adapter HTTP `PrismaNeonHttp`
- Toujours installer `@prisma/adapter-neon` explicitement avec `prisma` et `@prisma/client`
- `DATABASE_URL` (pooler) pour l'app et le seed, `DATABASE_URL_UNPOOLED` (direct) pour les migrations dans `prisma.config.ts`
- shadcn/ui + Tailwind v4 (config CSS uniquement, pas de tailwind.config.js)
- Vitest + React Testing Library — 80+ tests verts à maintenir
- @vercel/blob pour les photos uploadées via /inventory/new
- @react-pdf/renderer pour l'export PDF — dynamic import obligatoire, ssr: false

## Déploiement
- Vercel : https://partage-meubles-grands-parents.vercel.app
- Toutes les routes API doivent avoir `export const dynamic = 'force-dynamic'`
- Les fetches de polling doivent avoir `cache: 'no-store'`

## Utilisateurs
Définis dans `lib/users.ts` — 19 prénoms fixes, pas d'auth, identification par prénom en localStorage.

## Logique métier
- Pas de blocage sur les sélections — n'importe qui peut choisir n'importe quel objet
- Seule limite : quantité demandée par une personne > `item.quantity` → 400
- Conflit : `sum(suggestions.quantity) > item.quantity` → affiché avec 💬 "À discuter en famille"
- Ne jamais afficher le mot "conflit" dans l'UI
- Commentaire optionnel sur chaque sélection via `PATCH /api/suggestions/[id]`
- Soft delete sur `InventoryItem` via `deletedAt DateTime?` — jamais de hard delete
- Contrainte unique sur `InventoryItem.name` — catch erreur Prisma `P2002` → 409
- `GET /api/recap` retourne `byPerson` groupé + tableau `conflicts[]` avec `{ item, totalDemanded, demands[] }`

## Pages
- `/` — sélection prénom + bouton récap + bouton PDF + bouton "Gérer l'inventaire"
- `/suggest` — inventaire complet, recherche temps réel, optimistic UI, bouton "Ce n'est pas moi"
- `/recap` — choix par personne, polling 30s, section "À discuter en famille", export PDF
- `/inventory/new` — panneau admin : grid 20 cards, recherche, pagination, ✏️ modifier, 🗑️ rouge soft delete, formulaire ajout en bas

## Photos
- 32 photos dans `/public/` pour les items du seed
- Nouveaux items → Vercel Blob (URL absolue)
- `@react-pdf/renderer` n'accepte que les URLs absolues — préfixer les chemins `/public` avec `https://partage-meubles-grands-parents.vercel.app`
- Apostrophes dans les noms de fichiers : utiliser U+2019 `'` et non U+0027 `'`
