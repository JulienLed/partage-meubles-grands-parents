"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RecapRow } from "@/components/RecapRow";

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

interface RecapData {
  byPerson: Record<string, SuggestionWithConflict[]>;
  conflictCount: number;
}

const POLL_INTERVAL = 30_000;

export function RecapClient() {
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecap = useCallback(async () => {
    try {
      const res = await fetch("/api/recap");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecap();
    const id = setInterval(fetchRecap, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchRecap]);

  const persons = data ? Object.keys(data.byPerson).sort() : [];

  return (
    <main className="min-h-svh px-4 py-8">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {/* En-tête */}
        <div className="glass px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-warm-900)]">
              Récapitulatif des souhaits
            </h1>
            {data && data.conflictCount > 0 && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ {data.conflictCount} conflit{data.conflictCount > 1 ? "s" : ""} à résoudre en famille
              </p>
            )}
          </div>
          <div className="flex gap-3 text-sm flex-wrap">
            <Link
              href="/suggest"
              className="rounded-lg border border-[var(--color-warm-300)] px-3 py-1.5 text-[var(--color-warm-700)] hover:bg-[var(--color-warm-100)] transition-colors"
            >
              ← Retour à l&apos;inventaire
            </Link>
            <a
              href="/api/export"
              download="meubles-recap.pdf"
              className="rounded-lg border border-[var(--color-accent)] px-3 py-1.5 text-[var(--color-accent)] hover:bg-[var(--color-warm-100)] transition-colors"
            >
              Exporter PDF
            </a>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="glass px-6 py-10 text-center text-[var(--color-warm-400)]">
            Chargement…
          </div>
        ) : persons.length === 0 ? (
          <div className="glass px-6 py-10 text-center text-[var(--color-warm-400)]">
            Aucun souhait exprimé pour l&apos;instant.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {persons.map((person) => (
              <RecapRow
                key={person}
                person={person}
                suggestions={data!.byPerson[person]}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
