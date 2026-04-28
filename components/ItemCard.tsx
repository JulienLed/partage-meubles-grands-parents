"use client";

import Image from "next/image";

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
  availableQty: number;
  hasConflict: boolean;
  suggestions: Suggestion[];
}

interface ItemCardProps {
  item: Item;
  currentUser: string;
  onSelect: (itemId: number, quantity: number) => void;
  onCancel: (suggestionId: number) => void;
}

export function ItemCard({ item, currentUser, onSelect, onCancel }: ItemCardProps) {
  const isSoldOut = item.availableQty <= 0;
  const mySuggestion = item.suggestions.find((s) => s.suggestedBy === currentUser);

  return (
    <div
      className={[
        "glass flex flex-col gap-3 p-4 transition-opacity",
        isSoldOut && !mySuggestion ? "opacity-50 grayscale" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Photo */}
      <div className="relative h-40 w-full overflow-hidden rounded-lg bg-[var(--color-warm-100)]">
        <Image
          src={item.photoUrl ?? "/placeholder.jpg"}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder.jpg";
          }}
        />
      </div>

      {/* Infos */}
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-[var(--color-warm-900)]">{item.name}</h2>
        {item.description && (
          <p className="text-xs text-[var(--color-warm-500)]">{item.description}</p>
        )}
        <p className="text-xs text-[var(--color-warm-400)]">
          Disponible : {item.availableQty} / {item.quantity}
        </p>
      </div>

      {/* Action */}
      {mySuggestion ? (
        <button
          onClick={() => onCancel(mySuggestion.id)}
          className="mt-auto rounded-lg border-2 border-[var(--color-warm-400)] px-4 py-2 text-sm font-medium text-[var(--color-warm-600)] transition-colors hover:border-[var(--color-conflict)] hover:text-[var(--color-conflict)]"
        >
          Annuler
        </button>
      ) : (
        <button
          disabled={isSoldOut}
          onClick={() => onSelect(item.id, 1)}
          className="mt-auto rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Je veux cet objet
        </button>
      )}
    </div>
  );
}
