import React from "react";
import { Document, Page, View, Text, StyleSheet, type DocumentProps } from "@react-pdf/renderer";

// Ré-export du type pour les tests
export type { DocumentProps };

// ── Palette familiale ─────────────────────────────────────────────────────────
const CREAM      = "#faf8f5";
const WARM_900   = "#2c2416";
const WARM_600   = "#70593f";
const WARM_400   = "#a89478";
const WARM_200   = "#d9d0be";
const ACCENT     = "#b5864a";
const CONFLICT   = "#c0392b";

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: WARM_900,
    backgroundColor: CREAM,
    padding: 40,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: WARM_900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: WARM_600,
    marginBottom: 24,
    borderBottom: `1pt solid ${WARM_200}`,
    paddingBottom: 12,
  },
  personSection: {
    marginBottom: 20,
  },
  personHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: ACCENT,
    borderBottom: `1pt solid ${WARM_200}`,
    paddingBottom: 4,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    color: WARM_400,
    fontSize: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  itemNameConflict: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: CONFLICT,
  },
  conflictBadge: {
    fontSize: 8,
    color: CONFLICT,
    marginLeft: 4,
  },
  itemMeta: {
    fontSize: 8,
    color: WARM_600,
    marginTop: 1,
  },
  comment: {
    fontSize: 8,
    color: WARM_400,
    fontFamily: "Helvetica-Oblique",
    marginTop: 1,
  },
  emptyPerson: {
    fontSize: 9,
    color: WARM_400,
    paddingLeft: 8,
    fontFamily: "Helvetica-Oblique",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: `1pt solid ${WARM_200}`,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: WARM_400,
  },
  // Page "inventaire restant"
  tableHeader: {
    flexDirection: "row",
    borderBottom: `1pt solid ${ACCENT}`,
    paddingBottom: 4,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottom: `0.5pt solid ${WARM_200}`,
  },
  colName: { flex: 3, fontSize: 10 },
  colQty:  { flex: 1, fontSize: 10, textAlign: "center" },
  colDesc: { flex: 3, fontSize: 9, color: WARM_600 },
  colNameBold:  { flex: 3, fontSize: 10, fontFamily: "Helvetica-Bold" },
  colQtyBold:   { flex: 1, fontSize: 10, textAlign: "center", fontFamily: "Helvetica-Bold" },
  colDescBold:  { flex: 3, fontSize: 9, fontFamily: "Helvetica-Bold" },
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface InventoryItem {
  id: number;
  name: string;
  photoUrl?: string | null;
}

interface SuggestionRow {
  id: number;
  inventoryItemId: number;
  quantity: number;
  comment?: string | null;
  hasConflict: boolean;
  inventoryItem: InventoryItem;
}

export interface AvailableItem {
  id: number;
  name: string;
  description?: string | null;
  quantity: number;
  availableQty: number;
}

export interface RecapPDFProps {
  byPerson: Record<string, SuggestionRow[]>;
  conflictCount: number;
  availableItems?: AvailableItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(): string {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function RecapPDF({ byPerson, conflictCount, availableItems }: RecapPDFProps) {
  const persons = Object.keys(byPerson).sort();

  return (
    <Document
      title="Partage des affaires des grands-parents"
      author="Application familiale"
    >
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <Text style={s.title}>Partage des affaires des grands-parents</Text>
        <Text style={s.subtitle}>
          Récapitulatif généré le {formatDate()}
          {conflictCount > 0
            ? `  —  ⚠️ ${conflictCount} conflit${conflictCount > 1 ? "s" : ""} à résoudre en famille`
            : ""}
        </Text>

        {/* Sections par personne */}
        {persons.map((person) => {
          const suggestions = byPerson[person];
          return (
            <View key={person} style={s.personSection}>
              <Text style={s.personHeader}>{person}</Text>

              {suggestions.length === 0 ? (
                <Text style={s.emptyPerson}>Aucun souhait exprimé.</Text>
              ) : (
                suggestions.map((sug) => (
                  <View key={sug.id} style={s.itemRow}>
                    <Text style={s.bullet}>•</Text>
                    <View style={s.itemContent}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text
                          style={sug.hasConflict ? s.itemNameConflict : s.itemName}
                        >
                          {sug.inventoryItem.name}
                        </Text>
                        {sug.hasConflict && (
                          <Text style={s.conflictBadge}>⚠️ En discussion</Text>
                        )}
                      </View>
                      <Text style={s.itemMeta}>
                        Quantité : {sug.quantity}
                      </Text>
                      {sug.comment && (
                        <Text style={s.comment}>« {sug.comment} »</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}

        {/* Pied de page */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Partage des meubles — document confidentiel</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
      {/* Page 2 — Inventaire restant (optionnelle) */}
      {availableItems && availableItems.filter((i) => i.availableQty > 0).length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.title}>Inventaire disponible</Text>
          <Text style={s.subtitle}>
            Objets avec quantité disponible au {formatDate()}
          </Text>

          {/* En-tête tableau */}
          <View style={s.tableHeader}>
            <Text style={s.colNameBold}>Objet</Text>
            <Text style={s.colQtyBold}>Dispo.</Text>
            <Text style={s.colDescBold}>Description</Text>
          </View>

          {availableItems
            .filter((i) => i.availableQty > 0)
            .map((item) => (
              <View key={item.id} style={s.tableRow}>
                <Text style={s.colName}>{item.name}</Text>
                <Text style={s.colQty}>
                  {item.availableQty} / {item.quantity}
                </Text>
                <Text style={s.colDesc}>{item.description ?? ""}</Text>
              </View>
            ))}

          {/* Pied de page */}
          <View style={s.footer} fixed>
            <Text style={s.footerText}>Partage des meubles — document confidentiel</Text>
            <Text
              style={s.footerText}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </Page>
      )}
    </Document>
  );
}
