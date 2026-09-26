import { delay, getCollection, setCollection, nextId } from "./api";
import { addLedgerEntries } from "./ledgerService";

export async function listReceipts() {
  await delay();
  return getCollection("receipts");
}

export async function getReceipt(id) {
  await delay(150);
  return getCollection("receipts").find((r) => r.id === id) || null;
}

export async function createReceipt({ supplier, warehouse, lines }) {
  await delay();
  const receipts = getCollection("receipts");
  const id = nextId("RC", receipts);
  const receipt = {
    id,
    supplier,
    warehouse,
    status: "Draft",
    date: new Date().toISOString().slice(0, 10),
    lines,
  };
  setCollection("receipts", [...receipts, receipt]);
  return receipt;
}

// Validating a receipt increases stock at the destination warehouse and
// writes one ledger line per product, per the problem statement's flow.
export async function validateReceipt(id) {
  await delay();
  const receipts = getCollection("receipts");
  const idx = receipts.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Receipt not found.");
  const receipt = receipts[idx];
  if (receipt.status === "Done") return receipt;

  const products = getCollection("products");
  receipt.lines.forEach((line) => {
    const p = products.find((pr) => pr.id === line.productId);
    if (p) p.stock[receipt.warehouse] = (p.stock[receipt.warehouse] || 0) + Number(line.qty);
  });
  setCollection("products", products);

  addLedgerEntries(
    receipt.lines.map((line) => ({
      ref: receipt.id,
      type: "Receipt",
      productId: line.productId,
      warehouse: receipt.warehouse,
      change: Number(line.qty),
    }))
  );

  receipts[idx] = { ...receipt, status: "Done" };
  setCollection("receipts", receipts);
  return receipts[idx];
}

export async function setReceiptStatus(id, status) {
  await delay(200);
  const receipts = getCollection("receipts");
  const idx = receipts.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Receipt not found.");
  receipts[idx] = { ...receipts[idx], status };
  setCollection("receipts", receipts);
  return receipts[idx];
}
