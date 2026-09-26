const API_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request failed");
  }

  return result.data;
}

function normalizeProduct(product) {
  return {
    ...product,
    id: String(product.id),
    category: product.category_name || "",
    uom: product.unit_of_measure || "pcs",
    reorderPoint: Number(product.reorder_level || 0),
    stock: {
      total: Number(product.total_stock || 0),
    },
  };
}

export async function listProducts() {
  const products = await request("/products");
  return products.map(normalizeProduct);
}

export async function getProduct(id) {
  const product = await request(`/products/${id}`);
  return normalizeProduct(product);
}

export async function createProduct(data) {
  const product = await request("/products", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      sku: data.sku,
      category_id: data.categoryId || data.category_id,
      unit_of_measure: data.uom || "pcs",
      reorder_level: Number(data.reorderPoint) || 0,
    }),
  });

  return normalizeProduct(product);
}

export async function updateProduct(id, data) {
  const product = await request(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: data.name,
      sku: data.sku,
      category_id: data.categoryId || data.category_id,
      unit_of_measure: data.uom,
      reorder_level: Number(data.reorderPoint) || 0,
    }),
  });

  return normalizeProduct(product);
}

export async function deleteProduct(id) {
  return request(`/products/${id}`, {
    method: "DELETE",
  });
}

export function totalStock(product) {
  if (product.stock?.total !== undefined) {
    return Number(product.stock.total);
  }

  return Object.values(product.stock || {}).reduce(
    (total, value) => total + Number(value || 0),
    0
  );
}

export function isLowStock(product) {
  return totalStock(product) <= Number(product.reorderPoint || 0);
}

export function isOutOfStock(product) {
  return totalStock(product) === 0;
}