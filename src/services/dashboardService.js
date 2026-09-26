import { delay, getCollection } from "./api";
import { totalStock, isLowStock, isOutOfStock } from "./productService";

export async function getKpis() {
  await delay(300);
  const products = getCollection("products");
  const receipts = getCollection("receipts");
  const deliveries = getCollection("deliveries");
  const transfers = getCollection("transfers");

  return {
    totalProducts: products.length,
    lowStock: products.filter((p) => isLowStock(p) && !isOutOfStock(p)).length,
    outOfStock: products.filter(isOutOfStock).length,
    pendingReceipts: receipts.filter((r) => r.status !== "Done" && r.status !== "Canceled").length,
    pendingDeliveries: deliveries.filter((d) => d.status !== "Done" && d.status !== "Canceled").length,
    scheduledTransfers: transfers.filter((t) => t.status !== "Done" && t.status !== "Canceled").length,
  };
}

export async function getLowStockProducts() {
  await delay(200);
  const products = getCollection("products");
  return products
    .filter(isLowStock)
    .map((p) => ({ ...p, total: totalStock(p) }))
    .sort((a, b) => a.total - b.total);
}

export async function getRecentActivity(limit = 6) {
  await delay(200);
  const ledger = getCollection("ledger");
  return [...ledger].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}
