/**
 * Smoke test — RecapPDF
 *
 * @react-pdf/renderer ne produit pas de DOM — on vérifie juste que le
 * composant se rend sans erreur en appelant renderToBuffer().
 * Aucun jsdom nécessaire : le test tourne dans l'environnement Node par défaut.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { RecapPDF } from "@/components/RecapPDF";

type PDFElement = React.ReactElement<DocumentProps>;

const now = new Date("2026-04-28T10:00:00Z");

const byPerson = {
  Julien: [
    {
      id: 1,
      inventoryItemId: 10,
      quantity: 1,
      comment: "Pour le salon",
      hasConflict: false,
      inventoryItem: { id: 10, name: "Grande armoire", photoUrl: null },
      suggestedBy: "Julien",
      createdAt: now,
    },
    {
      id: 2,
      inventoryItemId: 11,
      quantity: 2,
      comment: null,
      hasConflict: false,
      inventoryItem: { id: 11, name: "Fauteuil stress-less", photoUrl: null },
      suggestedBy: "Julien",
      createdAt: now,
    },
  ],
  Simon: [
    {
      id: 3,
      inventoryItemId: 12,
      quantity: 1,
      comment: null,
      hasConflict: true,
      inventoryItem: { id: 12, name: "Buffet noyer", photoUrl: null },
      suggestedBy: "Simon",
      createdAt: now,
    },
  ],
  Augustin: [],
};

describe("RecapPDF — smoke test", () => {
  it("se rend sans erreur avec des données complètes", async () => {
    const element = React.createElement(RecapPDF, { byPerson, conflictCount: 1 });
    const buffer = await renderToBuffer(element as PDFElement);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // Un PDF valide commence par "%PDF"
    expect(buffer.toString("ascii", 0, 4)).toBe("%PDF");
  });

  it("se rend sans erreur quand byPerson est vide", async () => {
    const element = React.createElement(RecapPDF, { byPerson: {}, conflictCount: 0 });
    const buffer = await renderToBuffer(element as PDFElement);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.toString("ascii", 0, 4)).toBe("%PDF");
  });

  it("se rend sans erreur avec des items en conflit", async () => {
    const conflictData = {
      Louise: [
        {
          id: 4,
          inventoryItemId: 12,
          quantity: 1,
          comment: "Je le veux vraiment",
          hasConflict: true,
          inventoryItem: { id: 12, name: "Buffet noyer", photoUrl: null },
          suggestedBy: "Louise",
          createdAt: now,
        },
      ],
    };

    const element = React.createElement(RecapPDF, {
      byPerson: conflictData,
      conflictCount: 1,
    });
    const buffer = await renderToBuffer(element as PDFElement);

    expect(buffer.toString("ascii", 0, 4)).toBe("%PDF");
  });
});
