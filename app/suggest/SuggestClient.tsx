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

  async function handleSelect(itemId: number, quantity: number) {
    if (!currentUser) return;
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryItemId: itemId, suggestedBy: currentUser, quantity }),
    });
    if (res.status === 409) {
      toast.error("Désolé, cet objet n'est plus disponible.");
      return;
    }
    if (!res.ok) {
      toast.error("Une erreur est survenue.");
      return;
    }
    toast.success("Votre souhait a été enregistré ✓");
    refreshItems();
  }

  async function handleCancel(suggestionId: number) {
    if (!currentUser) return;
    const res = await fetch(
      `/api/suggestions/${suggestionId}?user=${encodeURIComponent(currentUser)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error("Impossible de supprimer ce souhait.");
      return;
    }
    toast.success("Souhait annulé.");
    refreshItems();
  }

  async function refreshItems() {
    const res = await fetch("/api/items");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
  }

  if (!currentUser) return null;

  return (
    <main className="min-h-svh px-4 py-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">
        {/* En-tête */}
        <div className="glass px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-warm-900)]">
              Inventaire des meubles
            </h1>
            <p className="text-sm text-[var(--color-warm-500)]">
              Bonjour {currentUser} — sélectionnez les objets qui vous intéressent
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link
              href="/recap"
              className="rounded-lg border border-[var(--color-warm-300)] px-3 py-1.5 text-[var(--color-warm-700)] hover:bg-[var(--color-warm-100)] transition-colors"
            >
              Voir le récap
            </Link>
            <Link
              href="/inventory/new"
              className="rounded-lg border border-[var(--color-accent)] px-3 py-1.5 text-[var(--color-accent)] hover:bg-[var(--color-warm-100)] transition-colors"
            >
              + Ajouter un objet
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
