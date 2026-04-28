"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { RecapRow } from "@/components/RecapRow";
import { RecapPDF, type AvailableItem } from "@/components/RecapPDF";

// PDFDownloadLink ne fonctionne qu'en client — ssr: false obligatoire
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span className="opacity-40">PDF…</span> }
);

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
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecap = useCallback(async () => {
    try {
      const [recapRes, itemsRes] = await Promise.all([
        fetch("/api/recap"),
        fetch("/api/items"),
      ]);
      if (recapRes.ok) setData(await recapRes.json());
      if (itemsRes.ok) {
        const { items } = await itemsRes.json();
        setAvailableItems(items);
      }
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
            {data && (
              <PDFDownloadLink
                document={
                  <RecapPDF
                    byPerson={data.byPerson}
                    conflictCount={data.conflictCount}
                    availableItems={availableItems}
                  />
                }
                fileName="meubles-grands-parents.pdf"
                className="rounded-lg border border-[var(--color-accent)] px-3 py-1.5 text-[var(--color-accent)] hover:bg-[var(--color-warm-100)] transition-colors"
              >
                {({ loading: pdfLoading }) => (pdfLoading ? "Préparation…" : "Télécharger PDF")}
              </PDFDownloadLink>
            )}
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
