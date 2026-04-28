// @vitest-environment jsdom
/**
 * Tests composant — ItemCard (utilisé sur /suggest)
 *
 * Composant attendu : components/ItemCard.tsx
 * Props :
 *   item         — InventoryItem enrichi (availableQty, hasConflict, suggestions[])
 *   currentUser  — prénom de l'utilisateur courant
 *   onSelect     — (itemId: number, quantity: number) => void
 *   onCancel     — (suggestionId: number) => void
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemCard } from "@/components/ItemCard";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const baseItem = {
  id: 1,
  name: "Grande armoire",
  description: "H200 × L180 × P60 cm",
  quantity: 2,
  photoUrl: "/Grande Armoire.jpg",
  notes: null,
  addedVia: "seed",
  availableQty: 2,
  hasConflict: false,
  suggestions: [] as Array<{
    id: number;
    inventoryItemId: number;
    suggestedBy: string;
    quantity: number;
    comment: string | null;
    createdAt: Date;
  }>,
};

const suggestionJulien = {
  id: 42,
  inventoryItemId: 1,
  suggestedBy: "Julien",
  quantity: 1,
  comment: null,
  createdAt: new Date(),
};

const defaultProps = {
  item: baseItem,
  currentUser: "Julien",
  onSelect: vi.fn(),
  onCancel: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

// ── Rendu de base ─────────────────────────────────────────────────────────────

describe("ItemCard — rendu", () => {
  it("affiche le nom de l'objet", () => {
    render(<ItemCard {...defaultProps} />);
    expect(screen.getByText("Grande armoire")).toBeInTheDocument();
  });

  it("affiche la description si elle existe", () => {
    render(<ItemCard {...defaultProps} />);
    expect(screen.getByText("H200 × L180 × P60 cm")).toBeInTheDocument();
  });

  it("affiche la photo quand photoUrl est renseigné", () => {
    render(<ItemCard {...defaultProps} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/Grande Armoire.jpg");
  });

  it("affiche un placeholder quand photoUrl est null", () => {
    render(
      <ItemCard
        {...defaultProps}
        item={{ ...baseItem, photoUrl: null }}
      />
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", expect.stringContaining("Grande armoire"));
  });

  it("affiche le nombre disponible", () => {
    render(<ItemCard {...defaultProps} item={{ ...baseItem, availableQty: 2 }} />);
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
  });
});

// ── État disponible ───────────────────────────────────────────────────────────

describe("ItemCard — disponible (availableQty > 0)", () => {
  it("affiche le bouton 'Je veux cet objet' quand availableQty > 0", () => {
    render(<ItemCard {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /je veux cet objet/i })
    ).toBeInTheDocument();
  });

  it("le bouton 'Je veux cet objet' est actif", () => {
    render(<ItemCard {...defaultProps} />);
    expect(screen.getByRole("button", { name: /je veux cet objet/i })).toBeEnabled();
  });

  it("clic sur 'Je veux cet objet' appelle onSelect avec l'id et la quantité", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ItemCard {...defaultProps} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /je veux cet objet/i }));

    expect(onSelect).toHaveBeenCalledWith(1, 1);
  });
});

// ── État épuisé ───────────────────────────────────────────────────────────────

describe("ItemCard — épuisé (availableQty = 0)", () => {
  const epuiseProps = {
    ...defaultProps,
    item: { ...baseItem, availableQty: 0 },
  };

  it("le bouton est désactivé quand availableQty = 0", () => {
    render(<ItemCard {...epuiseProps} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("la carte est visuellement grisée (classe CSS appropriée)", () => {
    const { container } = render(<ItemCard {...epuiseProps} />);
    // Vérifie que l'élément racine a une classe indiquant l'état désactivé
    const card = container.firstChild as HTMLElement;
    const classNames = card.className;
    // Accepte "opacity-50", "grayscale", "disabled", ou combinaison
    expect(
      classNames.includes("opacity") ||
      classNames.includes("grayscale") ||
      classNames.includes("disabled")
    ).toBe(true);
  });
});

// ── Déjà sélectionné par l'utilisateur courant ────────────────────────────────

describe("ItemCard — déjà sélectionné par currentUser", () => {
  const dejaSelectProps = {
    ...defaultProps,
    item: {
      ...baseItem,
      availableQty: 1,
      suggestions: [suggestionJulien],
    },
  };

  it("affiche 'Annuler' à la place de 'Je veux cet objet'", () => {
    render(<ItemCard {...dejaSelectProps} />);
    expect(
      screen.getByRole("button", { name: /annuler/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /je veux cet objet/i })
    ).not.toBeInTheDocument();
  });

  it("clic sur 'Annuler' appelle onCancel avec l'id de la suggestion", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ItemCard {...dejaSelectProps} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /annuler/i }));

    expect(onCancel).toHaveBeenCalledWith(42);
  });

  it("le bouton 'Annuler' est actif (l'user peut toujours se désister)", () => {
    render(<ItemCard {...dejaSelectProps} />);
    expect(screen.getByRole("button", { name: /annuler/i })).toBeEnabled();
  });
});

// ── Autre utilisateur a une suggestion — pas l'utilisateur courant ─────────────

describe("ItemCard — sélectionné par quelqu'un d'autre", () => {
  const autreSuggestion = { ...suggestionJulien, id: 99, suggestedBy: "Aurore" };
  const autreProps = {
    ...defaultProps,
    item: {
      ...baseItem,
      availableQty: 1,
      suggestions: [autreSuggestion],
    },
    currentUser: "Julien",
  };

  it("affiche 'Je veux cet objet' (pas 'Annuler') si l'autre personne a la suggestion", () => {
    render(<ItemCard {...autreProps} />);
    expect(
      screen.getByRole("button", { name: /je veux cet objet/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /annuler/i })
    ).not.toBeInTheDocument();
  });
});
