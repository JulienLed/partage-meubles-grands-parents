/**
 * Tests API — POST /api/suggestions · DELETE /api/suggestions/[id] · PATCH /api/suggestions/[id]
 *
 * Logique :
 *   POST : accepte toujours la création (plus de 409 pour stock épuisé) ;
 *          seule limite = quantité demandée > item.quantity total → 400
 *   DELETE : suppression de sa propre suggestion uniquement (vérification suggestedBy)
 *   PATCH  : mise à jour du commentaire d'une suggestion existante
 *
 * Convention :
 *   POST/GET → app/api/suggestions/route.ts
 *   DELETE/PATCH → app/api/suggestions/[id]/route.ts
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    inventoryItem: {
      findUnique: vi.fn(),
    },
    suggestion: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/suggestions/route";
import { DELETE, PATCH } from "@/app/api/suggestions/[id]/route";

function makeRequest(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

const validBody = {
  inventoryItemId: 1,
  suggestedBy: "Julien",
  quantity: 1,
  comment: "Je le prendrais volontiers",
};

// Item avec une suggestion existante (availableQty = 1, mais la règle ne s'applique plus)
const itemDisponible = {
  id: 1,
  name: "Fauteuil stress-less avec repose-pied",
  quantity: 2,
  suggestions: [
    { id: 5, inventoryItemId: 1, suggestedBy: "Aurore", quantity: 1, comment: null, createdAt: new Date() },
  ],
};

// Item dont toute la quantité est déjà demandée — ne bloque plus la création
const itemEpuise = {
  id: 2,
  name: "Buffet noyer",
  quantity: 1,
  suggestions: [
    { id: 6, inventoryItemId: 2, suggestedBy: "Simon", quantity: 1, comment: null, createdAt: new Date() },
  ],
};

// Item sans suggestions
const itemLibre = {
  id: 3,
  name: "Grande armoire",
  quantity: 1,
  suggestions: [],
};

const createdSuggestion = {
  id: 42,
  inventoryItemId: 1,
  suggestedBy: "Julien",
  quantity: 1,
  comment: "Je le prendrais volontiers",
  createdAt: new Date("2026-04-28T10:00:00Z"),
};

// -------------------------------------------------------------------------

describe("POST /api/suggestions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée une suggestion et renvoie 201 quand availableQty > 0", async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(itemDisponible as never);
    vi.mocked(prisma.suggestion.create).mockResolvedValue(createdSuggestion as never);

    const res = await POST(makeRequest("POST", "http://localhost/api/suggestions", validBody));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe(42);
    expect(json.suggestedBy).toBe("Julien");
    expect(prisma.suggestion.create).toHaveBeenCalledOnce();
  });

  it("crée une suggestion même si l'item est déjà entièrement réservé — plus de 409", async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(itemEpuise as never);
    vi.mocked(prisma.suggestion.create).mockResolvedValue({
      ...createdSuggestion,
      inventoryItemId: 2,
    } as never);

    const res = await POST(
      makeRequest("POST", "http://localhost/api/suggestions", {
        ...validBody,
        inventoryItemId: 2,
      })
    );

    expect(res.status).toBe(201);
    expect(prisma.suggestion.create).toHaveBeenCalledOnce();
  });

  it("crée une suggestion sur un item libre (availableQty = quantity)", async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(itemLibre as never);
    vi.mocked(prisma.suggestion.create).mockResolvedValue({
      ...createdSuggestion,
      inventoryItemId: 3,
    } as never);

    const res = await POST(
      makeRequest("POST", "http://localhost/api/suggestions", {
        ...validBody,
        inventoryItemId: 3,
      })
    );

    expect(res.status).toBe(201);
    expect(prisma.suggestion.create).toHaveBeenCalledOnce();
  });

  it("crée une suggestion même si la quantité demandée dépasse le disponible restant", async () => {
    // item.quantity=2, Rosalie a déjà 1 → il ne reste que 1 en théorie,
    // mais la nouvelle règle n'applique que la limite item.quantity total (2)
    const itemPresqueEpuise = {
      ...itemLibre,
      id: 4,
      quantity: 2,
      suggestions: [
        { id: 7, inventoryItemId: 4, suggestedBy: "Rosalie", quantity: 1, comment: null, createdAt: new Date() },
      ],
    };
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(itemPresqueEpuise as never);
    vi.mocked(prisma.suggestion.create).mockResolvedValue({
      ...createdSuggestion,
      inventoryItemId: 4,
      quantity: 2,
    } as never);

    const res = await POST(
      makeRequest("POST", "http://localhost/api/suggestions", {
        ...validBody,
        inventoryItemId: 4,
        quantity: 2,
      })
    );

    expect(res.status).toBe(201);
    expect(prisma.suggestion.create).toHaveBeenCalledOnce();
  });

  it("renvoie 400 si la quantité demandée dépasse la quantity totale de l'item", async () => {
    // itemLibre.quantity = 1 → demander 2 est interdit
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(itemLibre as never);

    const res = await POST(
      makeRequest("POST", "http://localhost/api/suggestions", {
        ...validBody,
        inventoryItemId: 3,
        quantity: 2,
      })
    );

    expect(res.status).toBe(400);
    expect(prisma.suggestion.create).not.toHaveBeenCalled();
  });

  it("renvoie 400 si inventoryItemId est absent", async () => {
    const { inventoryItemId: _omit, ...bodyInvalide } = validBody;
    const res = await POST(
      makeRequest("POST", "http://localhost/api/suggestions", bodyInvalide)
    );

    expect(res.status).toBe(400);
    expect(prisma.suggestion.create).not.toHaveBeenCalled();
  });

  it("renvoie 400 si suggestedBy est absent", async () => {
    const { suggestedBy: _omit, ...bodyInvalide } = validBody;
    const res = await POST(
      makeRequest("POST", "http://localhost/api/suggestions", bodyInvalide)
    );

    expect(res.status).toBe(400);
  });

  it("renvoie 400 si suggestedBy n'est pas dans la liste des utilisateurs autorisés", async () => {
    const res = await POST(
      makeRequest("POST", "http://localhost/api/suggestions", {
        ...validBody,
        suggestedBy: "Inconnu",
      })
    );

    expect(res.status).toBe(400);
    expect(prisma.suggestion.create).not.toHaveBeenCalled();
  });

  it("renvoie 404 si l'item n'existe pas", async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);

    const res = await POST(
      makeRequest("POST", "http://localhost/api/suggestions", {
        ...validBody,
        inventoryItemId: 9999,
      })
    );

    expect(res.status).toBe(404);
    expect(prisma.suggestion.create).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------------

describe("DELETE /api/suggestions/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime la suggestion et renvoie 200", async () => {
    vi.mocked(prisma.suggestion.findUnique).mockResolvedValue(createdSuggestion as never);
    vi.mocked(prisma.suggestion.delete).mockResolvedValue(createdSuggestion as never);

    // ?user=Julien correspond à createdSuggestion.suggestedBy
    const res = await DELETE(
      makeRequest("DELETE", "http://localhost/api/suggestions/42?user=Julien"),
      { params: Promise.resolve({ id: "42" }) }
    );

    expect(res.status).toBe(200);
    expect(prisma.suggestion.delete).toHaveBeenCalledWith({ where: { id: 42 } });
  });

  it("renvoie 403 si ?user ne correspond pas à l'auteur de la suggestion", async () => {
    vi.mocked(prisma.suggestion.findUnique).mockResolvedValue(createdSuggestion as never);

    const res = await DELETE(
      makeRequest("DELETE", "http://localhost/api/suggestions/42?user=Aurore"),
      { params: Promise.resolve({ id: "42" }) }
    );

    expect(res.status).toBe(403);
    expect(prisma.suggestion.delete).not.toHaveBeenCalled();
  });

  it("renvoie 400 si le query param ?user est absent", async () => {
    const res = await DELETE(
      makeRequest("DELETE", "http://localhost/api/suggestions/42"),
      { params: Promise.resolve({ id: "42" }) }
    );

    expect(res.status).toBe(400);
    expect(prisma.suggestion.delete).not.toHaveBeenCalled();
  });

  it("renvoie 404 si la suggestion n'existe pas", async () => {
    vi.mocked(prisma.suggestion.findUnique).mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("DELETE", "http://localhost/api/suggestions/999?user=Julien"),
      { params: Promise.resolve({ id: "999" }) }
    );

    expect(res.status).toBe(404);
    expect(prisma.suggestion.delete).not.toHaveBeenCalled();
  });

  it("renvoie 400 si l'id n'est pas un entier valide", async () => {
    const res = await DELETE(
      makeRequest("DELETE", "http://localhost/api/suggestions/abc?user=Julien"),
      { params: Promise.resolve({ id: "abc" }) }
    );

    expect(res.status).toBe(400);
  });
});

// -------------------------------------------------------------------------

describe("PATCH /api/suggestions/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("met à jour le commentaire et renvoie 200", async () => {
    const updated = { ...createdSuggestion, comment: "Je peux céder si besoin" };
    vi.mocked(prisma.suggestion.findUnique).mockResolvedValue(createdSuggestion as never);
    vi.mocked(prisma.suggestion.update).mockResolvedValue(updated as never);

    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/suggestions/42", {
        comment: "Je peux céder si besoin",
      }),
      { params: Promise.resolve({ id: "42" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.comment).toBe("Je peux céder si besoin");
    expect(prisma.suggestion.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { comment: "Je peux céder si besoin" },
    });
  });

  it("accepte un commentaire vide (effacement de la note)", async () => {
    const updated = { ...createdSuggestion, comment: "" };
    vi.mocked(prisma.suggestion.findUnique).mockResolvedValue(createdSuggestion as never);
    vi.mocked(prisma.suggestion.update).mockResolvedValue(updated as never);

    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/suggestions/42", { comment: "" }),
      { params: Promise.resolve({ id: "42" }) }
    );

    expect(res.status).toBe(200);
    expect(prisma.suggestion.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { comment: "" },
    });
  });

  it("renvoie 400 si le champ comment est absent du corps", async () => {
    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/suggestions/42", {}),
      { params: Promise.resolve({ id: "42" }) }
    );

    expect(res.status).toBe(400);
    expect(prisma.suggestion.update).not.toHaveBeenCalled();
  });

  it("renvoie 400 si l'id n'est pas un entier valide", async () => {
    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/suggestions/abc", { comment: "test" }),
      { params: Promise.resolve({ id: "abc" }) }
    );

    expect(res.status).toBe(400);
    expect(prisma.suggestion.update).not.toHaveBeenCalled();
  });

  it("renvoie 404 si la suggestion n'existe pas", async () => {
    vi.mocked(prisma.suggestion.findUnique).mockResolvedValue(null);

    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/suggestions/999", { comment: "test" }),
      { params: Promise.resolve({ id: "999" }) }
    );

    expect(res.status).toBe(404);
    expect(prisma.suggestion.update).not.toHaveBeenCalled();
  });
});
