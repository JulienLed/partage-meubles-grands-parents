/**
 * Tests API — GET /api/recap
 *
 * Retourne les suggestions groupées par personne (suggestedBy),
 * avec pour chaque item référencé :
 *   - hasConflict = item.quantity === 1 ET 2+ personnes différentes ont une suggestion
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

// Items de l'inventaire (lookup pour hasConflict)
const inventoryItems = [
  { id: 1, name: "Grande armoire",              quantity: 1, photoUrl: "/Grande Armoire.jpg",            description: "H200 × L180 × P60 cm" },
  { id: 2, name: "Fauteuil stress-less",         quantity: 2, photoUrl: "/stress-less avec repose pied.jpg", description: null },
  { id: 3, name: "Buffet noyer",                 quantity: 1, photoUrl: "/Buffet noyer.jpg",               description: null },
];

// Suggestions en base
const suggestions = [
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
  // Conflit : item 3 (quantity=1), demandé par Simon ET Louise
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
    quantity: "oops" as unknown as number, // Louise aussi veut ce buffet
    comment: null,
    createdAt: now,
    inventoryItem: inventoryItems[2],
  },
];

// Version corrigée pour les tests de conflit
const suggestionsAvecConflit = [
  ...suggestions.slice(0, 3),
  { ...suggestions[3] },
  { ...suggestions[4], quantity: 1 },
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

    // Personnes présentes dans le recap
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

  it("hasConflict = true sur un item quantity=1 demandé par 2+ personnes", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    // Simon et Louise veulent toutes deux le Buffet noyer (quantity=1)
    const suggSimon = json.byPerson["Simon"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 3
    );
    const suggLouise = json.byPerson["Louise"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 3
    );

    expect(suggSimon.hasConflict).toBe(true);
    expect(suggLouise.hasConflict).toBe(true);
  });

  it("hasConflict = false sur un item quantity=2 même avec 2 personnes", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    // Aurore et Julien veulent chacun 1 fauteuil stress-less (quantity=2, assez pour les 2)
    const suggAurore = json.byPerson["Aurore"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 2
    );
    expect(suggAurore.hasConflict).toBe(false);
  });

  it("hasConflict = false sur un item quantity=1 demandé par une seule personne", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    // Julien seul sur la Grande armoire (quantity=1)
    const suggJulien = json.byPerson["Julien"].find(
      (s: { inventoryItemId: number }) => s.inventoryItemId === 1
    );
    expect(suggJulien.hasConflict).toBe(false);
  });

  it("renvoie 200 avec byPerson vide si aucune suggestion", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue([] as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.byPerson).toEqual({});
  });

  it("inclut le nombre total de conflits dans la réponse", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionsAvecConflit as never);

    const res = await GET(makeRequest("http://localhost/api/recap"));
    const json = await res.json();

    expect(json.conflictCount).toBe(1); // item 3 (Buffet noyer) est en conflit
  });
});
