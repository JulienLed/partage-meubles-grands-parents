"use client";

import Image from "next/image";

interface InventoryItem {
  id: number;
  name: string;
  description?: string | null;
  quantity: number;
  photoUrl?: string | null;
  notes?: string | null;
  addedVia?: string | null;
}

interface SuggestionWithConflict {
  id: number;
  inventoryItemId: number;
  suggestedBy: string;
  quantity: number;
  comment?: string | null;
  createdAt: Date;
  hasConflict: boolean;
  inventoryItem: InventoryItem;
}

interface RecapRowProps {
  person: string;
  suggestions: SuggestionWithConflict[];
}

export function RecapRow({ person, suggestions }: RecapRowProps) {
  return (
    <section className="glass flex flex-col gap-4 p-5">
      <h2 className="text-lg font-semibold text-[var(--color-warm-900)]">{person}</h2>

      {suggestions.length === 0 ? (
        <p className="text-sm text-[var(--color-warm-400)] italic">Aucun choix pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {suggestions.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              {/* Miniature */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--color-warm-100)]">
                <Image
                  src={s.inventoryItem.photoUrl ?? "/placeholder.jpg"}
                  alt={s.inventoryItem.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder.jpg";
                  }}
                />
              </div>

              {/* Détails */}
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[var(--color-warm-900)] truncate">
                    {s.inventoryItem.name}
                  </span>
                  <span className="text-xs text-[var(--color-warm-500)]">
                    × {s.quantity}
                  </span>
                  {s.hasConflict && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      ⚠️ Conflit
                    </span>
                  )}
                </div>
                {s.comment && (
                  <p className="text-xs text-[var(--color-warm-500)] truncate">{s.comment}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
