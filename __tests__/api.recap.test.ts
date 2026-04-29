/**
 * Tests API — GET /api/recap
 *
 * Retourne les suggestions groupées par personne (suggestedBy),
 * avec pour chaque item référencé :
 *   - hasConflict = sum(suggestions.quantity) > item.quantity
 *
 * Inclut également :
 *   - conflictCount : nombre d'items distincts en conflit
 *   - conflicts     : tableau des items en conflit avec leurs demandes (section "Objets à départager")
 *
 * Convention : app/api/recap/route.ts → exports { GET }
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    suggestion: {
      findMany: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/recap/route";

function makeRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

const now = new Date("2026-04-28T10:00:00Z");

// Items de l'inventaire
const inventoryItems = [
  { id: 1, name: "Grande armoire",     quantity: 1, photoUrl: "/Grande Armoire.jpg",                description: "H200 × L180 × P60 cm" },
  { id: 2, name: "Fauteuil stress-less", quantity: 2, photoUrl: "/stress-less avec repose pied.jpg", description: null },
  { id: 3, name: "Buffet noyer",        quantity: 1, photoUrl: "/Buffet noyer.jpg",                  description: null },
];

// Suggestions : Julien seul sur item 1 ; Aurore+Julien sur item 2 (sum=2 = quantity → pas de conflit) ;
// Simon+Louise sur item 3 (sum=2 > quantity=1 → conflit)
const suggestionsAvecConflit = [
  {
    id: 10,
    inventoryItemId: 1,
    suggestedBy: "Julien",
    quantity: 1,
    comment: "Super armoire",
    createdAt: now,
    inventoryItem: inventoryItems[0],
  },
  {
    id: 11,
    inventoryItemId: 2,
    suggestedBy: "Aurore",
    quantity: 1,
    comment: null,
    createdAt: now,
    inventoryItem: inventoryItems[1],
  },
  {
    id: 12,
    inventoryItemId: 2,
    suggestedBy: "Julien",
    quantity: 1,
    comment: null,
    createdAt: now,
    inventoryItem: inventoryItems[1],
  },
  {
    id: 13,
    inventoryItemId: 3,
    suggestedBy: "Simon",
    quantity: 1,
    comment: null,
    createdAt: now,
    inventoryItem: inventoryItems[2],
  },
  {
    id: 14,
    inventoryItemId: 3,
    suggestedBy: "Louise",
    quantity: 1,
    comment: null,
    createdAt: now,
    inventoryItem: inventoryItems[2],
  },
];

// -------------------------------------------------------------------------

describe("GET /api/recap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renvoie 200", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue([] as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    expect(res.status).toBe(200);
  });

  it("groupe les suggestions par personne (suggestedBy)", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    const personnes = Object.keys(json.byPerson);
    expect(personnes).toContain("Julien");
    expect(personnes).toContain("Aurore");
    expect(personnes).toContain("Simon");
    expect(personnes).toContain("Louise");
  });

  it("chaque personne contient ses suggestions avec les infos de l'item", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    const suggestionsJulien = json.byPerson["Julien"];
    expect(suggestionsJulien).toHaveLength(2); // item 1 + item 2
    expect(suggestionsJulien.some((s: { inventoryItem: { name: string } }) => s.inventoryItem.name === "Grande armoire")).toBe(true);
    expect(suggestionsJulien.some((s: { inventoryItem: { name: string } }) => s.inventoryItem.name === "Fauteuil stress-less")).toBe(true);
  });

  it("hasConflict = true quand sum(quantités demandées) > item.quantity", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    // Simon et Louise demandent chacun 1 Buffet noyer (quantity=1) → sum=2 > 1 → conflit
    const suggSimon = json.byPerson["Simon"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 3
    );
    const suggLouise = json.byPerson["Louise"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 3
    );

    expect(suggSimon.hasConflict).toBe(true);
    expect(suggLouise.hasConflict).toBe(true);
  });

  it("hasConflict = false quand sum(quantités) = item.quantity (exactement couvert)", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    // Aurore 1 + Julien 1 = 2 = quantity=2 du fauteuil stress-less → pas de conflit
    const suggAurore = json.byPerson["Aurore"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 2
    );
    expect(suggAurore.hasConflict).toBe(false);
  });

  it("hasConflict = false sur un item demandé par une seule personne", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    // Julien seul sur la Grande armoire (quantity=1, sum=1, pas > 1)
    const suggJulien = json.byPerson["Julien"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 1
    );
    expect(suggJulien.hasConflict).toBe(false);
  });

  it("hasConflict = true quand sum > quantity même si quantity > 1", async () => {
    // Deux personnes demandent chacune 2 fauteuils stress-less (quantity=2) → sum=4 > 2 → conflit
    const suggestionsQteElevee = [
      { ...suggestionsAvecConflit[1], quantity: 2 }, // Aurore: 2 fauteuils
      { ...suggestionsAvecConflit[2], quantity: 2 }, // Julien: 2 fauteuils
    ];
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsQteElevee as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    const suggAurore = json.byPerson["Aurore"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 2
    );
    expect(suggAurore.hasConflict).toBe(true);
  });

  it("renvoie 200 avec byPerson vide si aucune suggestion", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue([] as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.byPerson).toEqual({});
  });

  it("inclut le nombre total d'items en conflit (conflictCount)", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    // item 3 (Buffet noyer) : sum=2 > 1 → 1 conflit
    expect(json.conflictCount).toBe(1);
  });

  it("inclut un tableau conflicts avec les items en conflit et leurs demandes", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    expect(Array.isArray(json.conflicts)).toBe(true);
    expect(json.conflicts).toHaveLength(1);

    const conflict = json.conflicts[0];
    expect(conflict.item.name).toBe("Buffet noyer");
    expect(conflict.item.quantity).toBe(1);
    expect(conflict.totalDemanded).toBe(2);
    expect(conflict.demands).toHaveLength(2);

    const demandeurs = conflict.demands.map((d: { suggestedBy: string }) => d.suggestedBy);
    expect(demandeurs).toContain("Simon");
    expect(demandeurs).toContain("Louise");
  });

  it("conflicts est vide quand aucun item n'est en conflit", async () => {
    // Seulement Julien sur item 1, Aurore+Julien sur item 2 (sum=2 = quantity) → aucun conflit
    const sansBuffet = suggestionsAvecConflit.slice(0, 3);
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(sansBuffet as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    expect(json.conflicts).toEqual([]);
    expect(json.conflictCount).toBe(0);
  });
});
