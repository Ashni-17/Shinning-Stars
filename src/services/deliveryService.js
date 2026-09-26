import { delay, getCollection, setCollection, nextId } from "./api";
import { addLedgerEntries } from "./ledgerService";

export async function listDeliveries() {
  await delay();
  return getCollection("deliveries");
}

export async function getDelivery(id) {
  await delay(150);
  return getCollection("deliveries").find((d) => d.id === id) || null;
}

export async function createDelivery({ customer, warehouse, lines }) {
  await delay();
  const deliveries = getCollection("deliveries");
  const id = nextId("DO", deliveries);
  const delivery = {
    id,
    customer,
    warehouse,
    status: "Draft",
    date: new Date().toISOString().slice(0, 10),
    lines,
  };
  setCollection("deliveries", [...deliveries, delivery]);
  return delivery;
}

// Validating a delivery (pick + pack) decreases stock at the source warehouse.
export async function validateDelivery(id) {
  await delay();
  const deliveries = getCollection("deliveries");
  const idx = deliveries.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error("Delivery not found.");
  const delivery = deliveries[idx];
  if (delivery.status === "Done") return delivery;

  const products = getCollection("products");
  delivery.lines.forEach((line) => {
    const p = products.find((pr) => pr.id === line.productId);
    if (p) p.stock[delivery.warehouse] = Math.max(0, (p.stock[delivery.warehouse] || 0) - Number(line.qty));
  });
  setCollection("products", products);

  addLedgerEntries(
    delivery.lines.map((line) => ({
      ref: delivery.id,
      type: "Delivery",
      productId: line.productId,
      warehouse: delivery.warehouse,
      change: -Number(line.qty),
    }))
  );

  deliveries[idx] = { ...delivery, status: "Done" };
  setCollection("deliveries", deliveries);
  return deliveries[idx];
}

export async function setDeliveryStatus(id, status) {
  await delay(200);
  const deliveries = getCollection("deliveries");
  const idx = deliveries.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error("Delivery not found.");
  deliveries[idx] = { ...deliveries[idx], status };
  setCollection("deliveries", deliveries);
  return deliveries[idx];
}
