// @vitest-environment jsdom
/**
 * Tests composant — UserPicker (page /)
 *
 * Composant attendu : components/UserPicker.tsx
 * - Affiche les 19 prénoms depuis lib/users.ts
 * - Clic → stocke en localStorage sous la clé "userName"
 * - Redirige vers /suggest via router.push
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserPicker } from "@/components/UserPicker";
import { VALID_USERS } from "@/lib/users";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

beforeEach(() => {
  localStorage.clear();
  mockPush.mockClear();
});

// ── Rendu ─────────────────────────────────────────────────────────────────────

describe("UserPicker — rendu", () => {
  it("affiche les 19 prénoms de la famille", () => {
    render(<UserPicker />);
    for (const name of VALID_USERS) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("affiche un bouton de sélection pour chacun des 19 prénoms", () => {
    render(<UserPicker />);
    for (const name of VALID_USERS) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("affiche un titre ou texte d'invitation", () => {
    render(<UserPicker />);
    expect(screen.getByText(/qui êtes-vous|choisissez|prénom/i)).toBeInTheDocument();
  });
});

// ── Interaction ───────────────────────────────────────────────────────────────

describe("UserPicker — interaction", () => {
  it("stocke le prénom sélectionné dans localStorage sous la clé userName", async () => {
    const user = userEvent.setup();
    render(<UserPicker />);

    await user.click(screen.getByText("Julien"));

    expect(localStorage.getItem("userName")).toBe("Julien");
  });

  it("stocke le bon prénom quelle que soit la personne cliquée", async () => {
    const user = userEvent.setup();
    render(<UserPicker />);

    await user.click(screen.getByText("Mathilde"));

    expect(localStorage.getItem("userName")).toBe("Mathilde");
  });

  it("redirige vers /suggest après sélection", async () => {
    const user = userEvent.setup();
    render(<UserPicker />);

    await user.click(screen.getByText("Julien"));

    expect(mockPush).toHaveBeenCalledWith("/suggest");
  });

  it("ne stocke rien tant qu'aucun prénom n'est cliqué", () => {
    render(<UserPicker />);
    expect(localStorage.getItem("userName")).toBeNull();
  });

  it("ne redirige pas avant qu'un prénom soit cliqué", () => {
    render(<UserPicker />);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
