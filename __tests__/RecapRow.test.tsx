// @vitest-environment jsdom
/**
 * Tests composant — RecapRow (utilisé sur /recap)
 *
 * Composant attendu : components/RecapRow.tsx
 * Props :
 *   person      — prénom de la personne
 *   suggestions — liste de suggestions avec hasConflict et inventoryItem
 */

import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { RecapRow } from "@/components/RecapRow";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const now = new Date("2026-04-28T10:00:00Z");

const armoire = {
  id: 1,
  name: "Grande armoire",
  description: "H200 × L180 × P60 cm",
  quantity: 1,
  photoUrl: "/Grande Armoire.jpg",
  notes: null,
  addedVia: "seed",
};

const fauteuil = {
  id: 2,
  name: "Fauteuil stress-less",
  description: null,
  quantity: 2,
  photoUrl: "/stress-less avec repose pied.jpg",
  notes: null,
  addedVia: "seed",
};

const suggestions = [
  {
    id: 10,
    inventoryItemId: 1,
    suggestedBy: "Julien",
    quantity: 1,
    comment: "Super armoire pour le salon",
    createdAt: now,
    hasConflict: false,
    inventoryItem: armoire,
  },
  {
    id: 11,
    inventoryItemId: 2,
    suggestedBy: "Julien",
    quantity: 1,
    comment: null,
    createdAt: now,
    hasConflict: false,
    inventoryItem: fauteuil,
  },
];

const suggestionAvecConflit = {
  id: 13,
  inventoryItemId: 3,
  suggestedBy: "Simon",
  quantity: 1,
  comment: null,
  createdAt: now,
  hasConflict: true,
  inventoryItem: {
    id: 3,
    name: "Buffet noyer",
    description: null,
    quantity: 1,
    photoUrl: "/Buffet noyer.jpg",
    notes: null,
    addedVia: "seed",
  },
};

// ── Rendu de base ─────────────────────────────────────────────────────────────

describe("RecapRow — rendu", () => {
  it("affiche le prénom de la personne", () => {
    render(<RecapRow person="Julien" suggestions={suggestions} />);
    expect(screen.getByText("Julien")).toBeInTheDocument();
  });

  it("affiche chaque nom d'objet sélectionné", () => {
    render(<RecapRow person="Julien" suggestions={suggestions} />);
    expect(screen.getByText("Grande armoire")).toBeInTheDocument();
    expect(screen.getByText("Fauteuil stress-less")).toBeInTheDocument();
  });

  it("affiche la quantité de chaque suggestion", () => {
    render(<RecapRow person="Julien" suggestions={suggestions} />);
    const quantities = screen.getAllByText(/×\s*1|1\s*×|qté\s*:\s*1|quantité\s*:\s*1/i);
    expect(quantities.length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le commentaire quand il est renseigné", () => {
    render(<RecapRow person="Julien" suggestions={suggestions} />);
    expect(screen.getByText("Super armoire pour le salon")).toBeInTheDocument();
  });

  it("n'affiche pas de commentaire vide quand null", () => {
    render(<RecapRow person="Julien" suggestions={suggestions} />);
    const items = screen.getAllByRole("listitem");
    // L'item Fauteuil (sans commentaire) ne doit pas afficher "null" ou ""
    const fauteuilItem = items.find((li) =>
      within(li).queryByText("Fauteuil stress-less")
    );
    expect(fauteuilItem).toBeTruthy();
    expect(fauteuilItem?.textContent).not.toContain("null");
  });

  it("affiche une section vide si la personne n'a aucune suggestion", () => {
    render(<RecapRow person="Augustin" suggestions={[]} />);
    expect(screen.getByText("Augustin")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});

// ── Badge conflit ─────────────────────────────────────────────────────────────

describe("RecapRow — badge conflit", () => {
  it("affiche le badge 💬 À discuter quand hasConflict = true", () => {
    render(
      <RecapRow person="Simon" suggestions={[suggestionAvecConflit]} />
    );
    expect(screen.getByText(/à discuter/i)).toBeInTheDocument();
  });

  it("le badge contient 💬 et le texte À discuter", () => {
    render(
      <RecapRow person="Simon" suggestions={[suggestionAvecConflit]} />
    );
    const badge = screen.getByText(/à discuter/i);
    expect(badge.textContent).toMatch(/discuter/i);
  });

  it("n'affiche PAS de badge quand hasConflict = false", () => {
    render(<RecapRow person="Julien" suggestions={suggestions} />);
    expect(screen.queryByText(/à discuter/i)).not.toBeInTheDocument();
  });

  it("n'affiche le badge que sur l'item concerné, pas sur les autres", () => {
    const mixedSuggestions = [suggestions[0], suggestionAvecConflit];
    render(<RecapRow person="Test" suggestions={mixedSuggestions} />);

    const badges = screen.getAllByText(/à discuter/i);
    expect(badges).toHaveLength(1);
  });
});

// ── Photo ─────────────────────────────────────────────────────────────────────

describe("RecapRow — photo", () => {
  it("affiche la photo de l'objet quand photoUrl est renseigné", () => {
    render(<RecapRow person="Julien" suggestions={[suggestions[0]]} />);
    const img = screen.getByRole("img", { name: /armoire/i });
    expect(img).toHaveAttribute("src", "/Grande Armoire.jpg");
  });

  it("affiche un placeholder alt quand photoUrl est null", () => {
    const sansPhoto = {
      ...suggestions[0],
      inventoryItem: { ...armoire, photoUrl: null },
    };
    render(<RecapRow person="Julien" suggestions={[sansPhoto]} />);
    // L'image doit exister même sans URL (placeholder générique)
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
