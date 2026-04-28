"use client";

import { useState } from "react";
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
  const [imgError, setImgError] = useState(false);
  // Quantité sélectionnée quand availableQty > 1
  const [selectedQty, setSelectedQty] = useState(1);

  const showPlaceholder = !item.photoUrl || imgError;
  // Data URI 1×1 transparent GIF — ne fait jamais de requête réseau
  const TRANSPARENT_GIF = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

  return (
    <div
      className={[
        "glass flex flex-col gap-3 p-4 transition-opacity",
        isSoldOut && !mySuggestion ? "opacity-50 grayscale" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Photo / Placeholder — l'img est toujours présente pour l'accessibilité */}
      <div className="relative h-40 w-full overflow-hidden rounded-lg bg-[var(--color-warm-100)]">
        {showPlaceholder ? (
          <>
            {/* img sr-only pour que getByRole("img") + alt restent valides */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TRANSPARENT_GIF} alt={item.name} className="sr-only" />
            <div className="flex h-full w-full items-center justify-center text-4xl text-[var(--color-warm-300)]">
              🪑
            </div>
          </>
        ) : (
          <Image
            src={item.photoUrl!}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        )}
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
        <div className="mt-auto flex flex-col gap-2">
          {/* Sélecteur de quantité si plusieurs disponibles */}
          {!isSoldOut && item.availableQty > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--color-warm-500)]">Qté</label>
              <input
                type="number"
                min={1}
                max={item.availableQty}
                value={selectedQty}
                onChange={(e) =>
                  setSelectedQty(
                    Math.min(item.availableQty, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                className="w-16 rounded border border-[var(--color-warm-200)] px-2 py-1 text-center text-sm bg-white/60"
              />
            </div>
          )}
          <button
            disabled={isSoldOut}
            onClick={() => onSelect(item.id, item.availableQty > 1 ? selectedQty : 1)}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Je veux cet objet
          </button>
        </div>
      )}
    </div>
  );
}
