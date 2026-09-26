const API_URL = "http://localhost:5000/api";

async function request(path) {
  const response = await fetch(`${API_URL}${path}`);
  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request failed");
  }

  return result.data;
}

export async function getKpis() {
  const data = await request("/dashboard");
  return data;
}

export async function getLowStockProducts() {
  const response = await fetch(`${API_URL}/products`);
  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request failed");
  }

  return result.data
    .map((p) => ({
      ...p,
      id: String(p.id),
      uom: p.unit_of_measure || "pcs",
      reorderPoint: Number(p.reorder_level || 0),
      total: Number(p.total_stock || 0),
      stock: { total: Number(p.total_stock || 0) },
    }))
    .filter((p) => p.total <= p.reorderPoint)
    .sort((a, b) => a.total - b.total);
}

export async function getRecentActivity() {
  return [];
}
