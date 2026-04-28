"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ItemCard } from "@/components/ItemCard";

interface Suggestion {
  id: number;
  inventoryItemId: number;
  suggestedBy: string;
  quantity: number;
  comment: string | null;
  createdAt: Date;
}

interface Item {
  id: number;
  name: string;
  description?: string | null;
  quantity: number;
  photoUrl?: string | null;
  notes?: string | null;
  availableQty: number;
  hasConflict: boolean;
  suggestions: Suggestion[];
}

interface Props {
  items: Item[];
}

export function SuggestClient({ items: initialItems }: Props) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (!name) {
      router.replace("/");
      return;
    }
    setCurrentUser(name);
  }, [router]);

  // --- Optimistic select ---
  async function handleSelect(itemId: number, quantity: number) {
    if (!currentUser) return;

    const prevItems = items;
    const item = items.find((i) => i.id === itemId);
    const tempId = -Date.now();

    // Mise à jour optimiste immédiate
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          availableQty: i.availableQty - quantity,
          suggestions: [
            ...i.suggestions,
            { id: tempId, inventoryItemId: itemId, suggestedBy: currentUser, quantity, comment: null, createdAt: new Date() },
          ],
        };
      })
    );

    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryItemId: itemId, suggestedBy: currentUser, quantity }),
    });

    if (!res.ok) {
      setItems(prevItems); // rollback
      if (res.status === 409) toast.error("Désolé, cet objet n'est plus disponible.");
      else toast.error("Une erreur est survenue. Réessaye.");
      return;
    }

    // Remplace la suggestion temporaire par la vraie
    const created: Suggestion = await res.json();
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          suggestions: i.suggestions.map((s) => (s.id === tempId ? created : s)),
        };
      })
    );

    toast.success(`✓ ${item?.name ?? "Objet"} ajouté à tes choix`);
  }

  // --- Optimistic cancel ---
  async function handleCancel(suggestionId: number) {
    if (!currentUser) return;

    const prevItems = items;
    let itemName = "";
    let removedQty = 0;

    setItems((prev) =>
      prev.map((i) => {
        const sug = i.suggestions.find((s) => s.id === suggestionId);
        if (!sug) return i;
        itemName = i.name;
        removedQty = sug.quantity;
        return {
          ...i,
          availableQty: i.availableQty + sug.quantity,
          suggestions: i.suggestions.filter((s) => s.id !== suggestionId),
        };
      })
    );

    const res = await fetch(
      `/api/suggestions/${suggestionId}?user=${encodeURIComponent(currentUser)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      setItems(prevItems); // rollback
      toast.error("Impossible d'annuler ce souhait.");
      return;
    }

    void removedQty; // utilisé pour l'optimistic update
    toast.success(`Choix annulé${itemName ? ` — ${itemName}` : ""}`);
  }

  if (!currentUser) return null;

  return (
    <main className="min-h-svh px-4 py-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">
        {/* En-tête */}
        <div className="glass px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-warm-900)]">
              Inventaire des meubles
            </h1>
            <p className="text-sm text-[var(--color-warm-500)]">
              Bonjour <span className="font-medium text-[var(--color-warm-700)]">{currentUser}</span> — sélectionne les objets qui t&apos;intéressent
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {/* Point 3 — Ce n'est pas moi */}
            <button
              onClick={() => router.replace("/")}
              className="text-xs text-[var(--color-warm-400)] underline underline-offset-2 hover:text-[var(--color-warm-600)] transition-colors"
            >
              Ce n&apos;est pas moi
            </button>
            <Link
              href="/recap"
              className="rounded-lg border border-[var(--color-warm-300)] px-3 py-1.5 text-[var(--color-warm-700)] hover:bg-[var(--color-warm-100)] transition-colors"
            >
              Voir le récap
            </Link>
          </div>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              currentUser={currentUser}
              onSelect={handleSelect}
              onCancel={handleCancel}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
