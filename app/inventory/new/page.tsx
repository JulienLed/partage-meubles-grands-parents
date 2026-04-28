"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VideoBackground } from "@/components/VideoBackground";

export default function NewInventoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      let photoUrl: string | null = null;

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Échec de l'upload");
        const { url } = await uploadRes.json();
        photoUrl = url;
      }

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          quantity,
          notes: notes.trim() || null,
          photoUrl,
          addedVia: "manual",
        }),
      });

      if (!res.ok) throw new Error("Échec de la création");

      toast.success("Objet ajouté à l'inventaire ✓");
      router.push("/suggest");
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <VideoBackground />
      <main className="min-h-svh flex items-center justify-center px-4 py-10">
        <div className="glass w-full max-w-lg px-8 py-8 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-warm-900)]">
              Ajouter un objet
            </h1>
            <p className="mt-1 text-sm text-[var(--color-warm-500)]">
              Complétez les informations, puis enregistrez.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nom */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--color-warm-800)]">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Buffet noyer"
                className="rounded-lg border border-[var(--color-warm-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] bg-white/60"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--color-warm-800)]">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex : H99 × L89 × P51 cm"
                className="rounded-lg border border-[var(--color-warm-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] bg-white/60"
              />
            </div>

            {/* Quantité */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--color-warm-800)]">
                Quantité
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 rounded-lg border border-[var(--color-warm-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] bg-white/60"
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--color-warm-800)]">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Informations complémentaires…"
                className="rounded-lg border border-[var(--color-warm-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] bg-white/60 resize-none"
              />
            </div>

            {/* Photo */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--color-warm-800)]">
                Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm text-[var(--color-warm-600)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-warm-100)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-warm-700)] hover:file:bg-[var(--color-warm-200)]"
              />
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Aperçu"
                  className="h-40 w-full rounded-lg object-cover border border-[var(--color-warm-200)]"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-lg border border-[var(--color-warm-300)] px-4 py-2 text-sm font-medium text-[var(--color-warm-600)] hover:bg-[var(--color-warm-100)] transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex-1 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {submitting ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
