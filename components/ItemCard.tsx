"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";

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
  suggestions: Suggestion[];
}

interface ItemCardProps {
  item: Item;
  currentUser: string;
  onSelect: (itemId: number, quantity: number) => void;
  onCancel: (suggestionId: number) => void;
}

// Data URI 1×1 transparent GIF — ne fait jamais de requête réseau
const TRANSPARENT_GIF = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export function ItemCard({ item, currentUser, onSelect, onCancel }: ItemCardProps) {
  const mySuggestion = item.suggestions.find((s) => s.suggestedBy === currentUser);
  const [imgError, setImgError] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteValue, setNoteValue] = useState(mySuggestion?.comment ?? "");

  // Resync la note quand la suggestion change (ex : annulation + nouvelle sélection)
  useEffect(() => {
    setNoteValue(mySuggestion?.comment ?? "");
    setNoteOpen(false);
  }, [mySuggestion?.id]);

  const showPlaceholder = !item.photoUrl || imgError;

  async function saveNote() {
    if (!mySuggestion) return;
    try {
      const res = await fetch(`/api/suggestions/${mySuggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: noteValue.trim() }),
      });
      if (!res.ok) toast.error("Impossible d'enregistrer la note.");
    } catch {
      toast.error("Impossible d'enregistrer la note.");
    }
    setNoteOpen(false);
  }

  return (
    <div className="glass flex flex-col gap-3 p-4">
      {/* Photo / Placeholder */}
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
      </div>

      {/* Action */}
      {mySuggestion ? (
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={() => onCancel(mySuggestion.id)}
            className="rounded-lg border-2 border-[var(--color-warm-400)] px-4 py-2 text-sm font-medium text-[var(--color-warm-600)] transition-colors hover:border-[var(--color-conflict)] hover:text-[var(--color-conflict)]"
          >
            Annuler
          </button>

          {/* Note discrète */}
          {noteOpen ? (
            <div className="flex items-start gap-2">
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setNoteOpen(false); }}
                placeholder="Je peux céder si besoin…"
                rows={2}
                autoFocus
                className="flex-1 resize-none rounded-md border border-[var(--color-warm-200)] bg-white/60 px-3 py-2 text-xs text-[var(--color-warm-700)] placeholder-[var(--color-warm-300)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <button
                onClick={saveNote}
                className="shrink-0 rounded-md bg-[var(--color-accent)] px-2 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                Enregistrer
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => setNoteOpen(true)}
                className="self-start text-xs text-[var(--color-warm-400)] underline underline-offset-2 transition-colors hover:text-[var(--color-warm-600)]"
              >
                {noteValue ? "Modifier la note" : "Ajouter une note"}
              </button>
              {noteValue && (
                <p className="text-xs italic text-[var(--color-warm-500)]">{noteValue}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-2">
          {item.quantity > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--color-warm-500)]">Qté</label>
              <input
                type="number"
                min={1}
                max={item.quantity}
                value={selectedQty}
                onChange={(e) =>
                  setSelectedQty(
                    Math.min(item.quantity, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                className="w-16 rounded border border-[var(--color-warm-200)] bg-white/60 px-2 py-1 text-center text-sm"
              />
            </div>
          )}
          <button
            onClick={() => onSelect(item.id, item.quantity > 1 ? selectedQty : 1)}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Je veux cet objet
          </button>
        </div>
      )}
    </div>
  );
}
