"use client";

import { useState } from "react";
import { RecapPDF, type AvailableItem } from "@/components/RecapPDF";

export function DownloadPDFButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const [{ pdf }, recapRes, itemsRes] = await Promise.all([
        import("@react-pdf/renderer"),
        fetch("/api/recap"),
        fetch("/api/items"),
      ]);

      if (!recapRes.ok || !itemsRes.ok) {
        alert("Erreur lors de la récupération des données.");
        return;
      }

      const recapData = await recapRes.json();
      const { items }: { items: AvailableItem[] } = await itemsRes.json();

      const blob = await pdf(
        <RecapPDF
          byPerson={recapData.byPerson}
          conflictCount={recapData.conflictCount}
          availableItems={items}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meubles-grands-parents.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-[var(--color-warm-400)] underline underline-offset-2 hover:text-[var(--color-warm-600)] transition-colors disabled:opacity-50"
    >
      {loading ? "Génération…" : "Télécharger le récap PDF"}
    </button>
  );
}
