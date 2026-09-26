import { delay, getCollection, setCollection, nextId } from "./api";
import { addLedgerEntries } from "./ledgerService";

export async function listTransfers() {
  await delay();
  return getCollection("transfers");
}

export async function getTransfer(id) {
  await delay(150);
  return getCollection("transfers").find((t) => t.id === id) || null;
}

export async function createTransfer({ from, to, lines }) {
  await delay();
  const transfers = getCollection("transfers");
  const id = nextId("TR", transfers);
  const transfer = {
    id,
    from,
    to,
    status: "Draft",
    date: new Date().toISOString().slice(0, 10),
    lines,
  };
  setCollection("transfers", [...transfers, transfer]);
  return transfer;
}

// Validating a transfer moves quantity from one location to another —
// total stock is unchanged, only the location breakdown updates.
export async function validateTransfer(id) {
  await delay();
  const transfers = getCollection("transfers");
  const idx = transfers.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Transfer not found.");
  const transfer = transfers[idx];
  if (transfer.status === "Done") return transfer;

  const products = getCollection("products");
  transfer.lines.forEach((line) => {
    const p = products.find((pr) => pr.id === line.productId);
    if (p) {
      p.stock[transfer.from] = Math.max(0, (p.stock[transfer.from] || 0) - Number(line.qty));
      p.stock[transfer.to] = (p.stock[transfer.to] || 0) + Number(line.qty);
    }
  });
  setCollection("products", products);

  addLedgerEntries(
    transfer.lines.flatMap((line) => [
      { ref: transfer.id, type: "Transfer", productId: line.productId, warehouse: transfer.from, change: -Number(line.qty) },
      { ref: transfer.id, type: "Transfer", productId: line.productId, warehouse: transfer.to, change: Number(line.qty) },
    ])
  );

  transfers[idx] = { ...transfer, status: "Done" };
  setCollection("transfers", transfers);
  return transfers[idx];
}

export async function setTransferStatus(id, status) {
  await delay(200);
  const transfers = getCollection("transfers");
  const idx = transfers.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Transfer not found.");
  transfers[idx] = { ...transfers[idx], status };
  setCollection("transfers", transfers);
  return transfers[idx];
}
