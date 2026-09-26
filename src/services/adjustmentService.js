import { delay, getCollection, setCollection, nextId } from "./api";
import { addLedgerEntries } from "./ledgerService";

export async function listAdjustments() {
  await delay();
  return getCollection("adjustments");
}

export async function getAdjustment(id) {
  await delay(150);
  return getCollection("adjustments").find((a) => a.id === id) || null;
}

export async function createAdjustment({ warehouse, reason, lines }) {
  await delay();
  const adjustments = getCollection("adjustments");
  const id = nextId("AD", adjustments);
  // lines: [{ productId, expected, counted }]
  const adjustment = {
    id,
    warehouse,
    reason,
    status: "Draft",
    date: new Date().toISOString().slice(0, 10),
    lines,
  };
  setCollection("adjustments", [...adjustments, adjustment]);
  return adjustment;
}

// Applying an adjustment sets stock at that location to the counted
// quantity and logs the delta between recorded and physical count.
export async function applyAdjustment(id) {
  await delay();
  const adjustments = getCollection("adjustments");
  const idx = adjustments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error("Adjustment not found.");
  const adjustment = adjustments[idx];
  if (adjustment.status === "Done") return adjustment;

  const products = getCollection("products");
  const entries = [];
  adjustment.lines.forEach((line) => {
    const p = products.find((pr) => pr.id === line.productId);
    if (p) {
      const delta = Number(line.counted) - Number(line.expected);
      p.stock[adjustment.warehouse] = Number(line.counted);
      if (delta !== 0) {
        entries.push({ ref: adjustment.id, type: "Adjustment", productId: line.productId, warehouse: adjustment.warehouse, change: delta });
      }
    }
  });
  setCollection("products", products);
  if (entries.length) addLedgerEntries(entries);

  adjustments[idx] = { ...adjustment, status: "Done" };
  setCollection("adjustments", adjustments);
  return adjustments[idx];
}
