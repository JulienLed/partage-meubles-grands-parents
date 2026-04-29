// @vitest-environment jsdom
/**
 * Tests composant — ItemCard (utilisé sur /suggest)
 *
 * Composant attendu : components/ItemCard.tsx
 * Props :
 *   item         — InventoryItem (quantity, suggestions[])
 *   currentUser  — prénom de l'utilisateur courant
 *   onSelect     — (itemId: number, quantity: number) => void
 *   onCancel     — (suggestionId: number) => void
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemCard } from "@/components/ItemCard";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// Mock fetch pour le PATCH note
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

const baseItem = {
  id: 1,
  name: "Grande armoire",
  description: "H200 × L180 × P60 cm",
  quantity: 2,
  photoUrl: "/Grande Armoire.jpg",
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

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({}) });
});

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
});

// ── Sélection disponible — plus de blocage ────────────────────────────────────

describe("ItemCard — bouton de sélection toujours actif", () => {
  it("affiche le bouton 'Je veux cet objet'", () => {
    render(<ItemCard {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /je veux cet objet/i })
    ).toBeInTheDocument();
  });

  it("le bouton est toujours actif (pas de disabled)", () => {
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

  it("le bouton est actif même quand d'autres personnes ont déjà sélectionné l'objet", () => {
    const autreSuggestion = { ...suggestionJulien, id: 99, suggestedBy: "Aurore" };
    render(
      <ItemCard
        {...defaultProps}
        item={{ ...baseItem, suggestions: [autreSuggestion] }}
      />
    );
    expect(screen.getByRole("button", { name: /je veux cet objet/i })).toBeEnabled();
  });
});

// ── Déjà sélectionné par l'utilisateur courant ────────────────────────────────

describe("ItemCard — déjà sélectionné par currentUser", () => {
  const dejaSelectProps = {
    ...defaultProps,
    item: { ...baseItem, suggestions: [suggestionJulien] },
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

  it("le bouton 'Annuler' est actif", () => {
    render(<ItemCard {...dejaSelectProps} />);
    expect(screen.getByRole("button", { name: /annuler/i })).toBeEnabled();
  });

  it("affiche le lien 'Ajouter une note' après sélection", () => {
    render(<ItemCard {...dejaSelectProps} />);
    expect(screen.getByRole("button", { name: /ajouter une note/i })).toBeInTheDocument();
  });

  it("affiche 'Modifier la note' quand un commentaire existe déjà", () => {
    render(
      <ItemCard
        {...defaultProps}
        item={{ ...baseItem, suggestions: [{ ...suggestionJulien, comment: "Je peux céder si besoin" }] }}
      />
    );
    expect(screen.getByRole("button", { name: /modifier la note/i })).toBeInTheDocument();
  });

  it("clic sur 'Ajouter une note' affiche le champ texte avec le bon placeholder", async () => {
    const user = userEvent.setup();
    render(<ItemCard {...dejaSelectProps} />);

    await user.click(screen.getByRole("button", { name: /ajouter une note/i }));

    expect(
      screen.getByPlaceholderText(/je peux céder si besoin/i)
    ).toBeInTheDocument();
  });

  it("blur sur le champ note appelle PATCH /api/suggestions/:id", async () => {
    const user = userEvent.setup();
    render(<ItemCard {...dejaSelectProps} />);

    await user.click(screen.getByRole("button", { name: /ajouter une note/i }));
    const textarea = screen.getByPlaceholderText(/je peux céder si besoin/i);
    await user.type(textarea, "Je laisse priorité à Simon");
    await user.tab(); // déclenche blur → saveNote

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/suggestions/42",
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });
});

// ── Autre utilisateur a une suggestion — pas l'utilisateur courant ─────────────

describe("ItemCard — sélectionné par quelqu'un d'autre", () => {
  const autreSuggestion = { ...suggestionJulien, id: 99, suggestedBy: "Aurore" };
  const autreProps = {
    ...defaultProps,
    item: { ...baseItem, suggestions: [autreSuggestion] },
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
