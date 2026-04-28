/**
 * Tests API — GET /api/items
 *
 * Retourne les items de l'inventaire enrichis de :
 *   - availableQty = item.quantity - sum(suggestions.quantity)
 *   - hasConflict  = item.quantity === 1 ET suggestions de 2+ personnes différentes
 *
 * Convention : app/api/items/route.ts → exports { GET }
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/items/route";

function makeRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

// Item avec suggestions incluses (simulant le findMany avec include)
const itemSansConflitNiSuggestion = {
  id: 1,
  name: "Grande armoire",
  description: "H200 × L180 × P60 cm",
  quantity: 1,
  photoUrl: "/Grande Armoire.jpg",
  notes: null,
  addedVia: "seed",
  suggestions: [],
};

const itemQuantite2SuggestionsMultiples = {
  id: 2,
  name: "Fauteuil stress-less avec repose-pied",
  description: null,
  quantity: 2,
  photoUrl: "/stress-less avec repose pied.jpg",
  notes: null,
  addedVia: "seed",
  suggestions: [
    { id: 10, inventoryItemId: 2, suggestedBy: "Julien",  quantity: 1, comment: null, createdAt: new Date() },
    { id: 11, inventoryItemId: 2, suggestedBy: "Aurore",  quantity: 1, comment: null, createdAt: new Date() },
  ],
};

const itemQuantite1Conflit = {
  id: 3,
  name: "Buffet noyer",
  description: null,
  quantity: 1,
  photoUrl: "/Buffet noyer.jpg",
  notes: null,
  addedVia: "seed",
  suggestions: [
    { id: 20, inventoryItemId: 3, suggestedBy: "Simon",   quantity: 1, comment: null, createdAt: new Date() },
    { id: 21, inventoryItemId: 3, suggestedBy: "Louise",  quantity: 1, comment: null, createdAt: new Date() },
  ],
};

const itemQuantite1SansConflit = {
  id: 4,
  name: "Lit double",
  description: null,
  quantity: 1,
  photoUrl: "/Lit double.jpg",
  notes: null,
  addedVia: "seed",
  suggestions: [
    { id: 30, inventoryItemId: 4, suggestedBy: "Mathilde", quantity: 1, comment: null, createdAt: new Date() },
  ],
};

// -------------------------------------------------------------------------

describe("GET /api/items", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renvoie 200 avec la liste des items", async () => {
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
      [itemSansConflitNiSuggestion] as never
    );

    const res = await GET(makeRequest("http://localhost/api/items"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
  });

  it("calcule availableQty = quantity - sum(suggestions.quantity)", async () => {
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
      [itemQuantite2SuggestionsMultiples] as never
    );

    const res = await GET(makeRequest("http://localhost/api/items"));
    const json = await res.json();

    const item = json.items[0];
    expect(item.availableQty).toBe(0); // 2 - 1 - 1
  });

  it("availableQty = quantity quand aucune suggestion", async () => {
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
      [itemSansConflitNiSuggestion] as never
    );

    const res = await GET(makeRequest("http://localhost/api/items"));
    const json = await res.json();

    expect(json.items[0].availableQty).toBe(1);
  });

  it("hasConflict = true quand quantity=1 et 2+ personnes différentes ont une suggestion", async () => {
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
      [itemQuantite1Conflit] as never
    );

    const res = await GET(makeRequest("http://localhost/api/items"));
    const json = await res.json();

    expect(json.items[0].hasConflict).toBe(true);
  });

  it("hasConflict = false quand quantity=1 et une seule personne a une suggestion", async () => {
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
      [itemQuantite1SansConflit] as never
    );

    const res = await GET(makeRequest("http://localhost/api/items"));
    const json = await res.json();

    expect(json.items[0].hasConflict).toBe(false);
  });

  it("hasConflict = false quand quantity>1, même avec 2+ personnes", async () => {
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
      [itemQuantite2SuggestionsMultiples] as never
    );

    const res = await GET(makeRequest("http://localhost/api/items"));
    const json = await res.json();

    expect(json.items[0].hasConflict).toBe(false);
  });

  it("inclut les suggestions dans les résultats (pour affichage côté client)", async () => {
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
      [itemQuantite2SuggestionsMultiples] as never
    );

    const res = await GET(makeRequest("http://localhost/api/items"));
    const json = await res.json();

    expect(json.items[0].suggestions).toHaveLength(2);
  });
});
