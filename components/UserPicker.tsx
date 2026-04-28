"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { VALID_USERS } from "@/lib/users";
import { DownloadPDFButton } from "@/components/DownloadPDFButton";

export function UserPicker() {
  const router = useRouter();

  function handleSelect(name: string) {
    localStorage.setItem("userName", name);
    router.push("/suggest");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="glass w-full max-w-xl px-8 py-10 flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-warm-900)]">
            Partage des meubles
          </h1>
          <p className="mt-3 text-sm text-[var(--color-warm-600)]">
            Choisissez votre prénom pour parcourir l&apos;inventaire et exprimer vos souhaits.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {VALID_USERS.map((name) => (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              className="rounded-xl border-2 border-[var(--color-warm-200)] px-6 py-3 text-base font-medium text-[var(--color-warm-800)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-warm-100)] hover:text-[var(--color-warm-900)]"
            >
              {name}
            </button>
          ))}
        </div>

        {/* Liens discrets en bas de carte */}
        <div className="border-t border-[var(--color-warm-200)] pt-4 w-full flex justify-center gap-6">
          <DownloadPDFButton />
          <Link
            href="/inventory/new"
            className="text-xs text-[var(--color-warm-400)] underline underline-offset-2 hover:text-[var(--color-warm-600)] transition-colors"
          >
            Gérer l&apos;inventaire
          </Link>
        </div>
      </div>
    </div>
  );
}
