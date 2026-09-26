import { delay, getCollection, setCollection } from "./api";

export async function listProducts() {
  await delay();
  return getCollection("products");
}

export async function getProduct(id) {
  await delay(150);
  return getCollection("products").find((p) => p.id === id) || null;
}

export async function createProduct(data) {
  await delay();
  const products = getCollection("products");
  const id = `p${products.length + 1}${Date.now() % 1000}`;
  const product = {
    id,
    name: data.name,
    sku: data.sku,
    category: data.category,
    uom: data.uom,
    reorderPoint: Number(data.reorderPoint) || 0,
    stock: { "wh-main": Number(data.initialStock) || 0, "wh-prod": 0, "wh-2": 0 },
  };
  setCollection("products", [...products, product]);
  return product;
}

export async function updateProduct(id, data) {
  await delay();
  const products = getCollection("products");
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Product not found.");
  products[idx] = { ...products[idx], ...data, reorderPoint: Number(data.reorderPoint) };
  setCollection("products", products);
  return products[idx];
}

export function totalStock(product) {
  return Object.values(product.stock || {}).reduce((a, b) => a + b, 0);
}

export function isLowStock(product) {
  return totalStock(product) <= product.reorderPoint;
}

export function isOutOfStock(product) {
  return totalStock(product) === 0;
}
