import { delay, getCollection, setCollection } from "./api";

export async function listWarehouses() {
  await delay(200);
  return getCollection("warehouses");
}

export async function createWarehouse({ name, location, manager }) {
  await delay();
  const warehouses = getCollection("warehouses");
  const id = `wh-${warehouses.length + 1}${Date.now() % 1000}`;
  const warehouse = { id, name, location, manager };
  setCollection("warehouses", [...warehouses, warehouse]);
  return warehouse;
}

export async function updateWarehouse(id, data) {
  await delay();
  const warehouses = getCollection("warehouses");
  const idx = warehouses.findIndex((w) => w.id === id);
  if (idx === -1) throw new Error("Warehouse not found.");
  warehouses[idx] = { ...warehouses[idx], ...data };
  setCollection("warehouses", warehouses);
  return warehouses[idx];
}
