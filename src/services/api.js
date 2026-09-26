// Lightweight local data layer standing in for the real backend (see /backend).
// Swap the bodies of the service files for real HTTP calls (fetch/axios) once
// the Express API in /backend is wired up — the function signatures below are
// written to match what those endpoints will return.

const DB_KEY = "stocksense_db_v1";

const seed = {
  products: [
    { id: "p1", name: "Steel Rods 12mm", sku: "STL-ROD-12", category: "Raw Materials", uom: "kg", reorderPoint: 200, stock: { "wh-main": 640, "wh-prod": 80, "wh-2": 120 } },
    { id: "p2", name: "Hex Bolts M8", sku: "HRD-BLT-M8", category: "Components", uom: "pcs", reorderPoint: 500, stock: { "wh-main": 2200, "wh-prod": 300, "wh-2": 0 } },
    { id: "p3", name: "Oak Chair Frame", sku: "FUR-CHR-OAK", category: "Finished Goods", uom: "pcs", reorderPoint: 15, stock: { "wh-main": 42, "wh-prod": 6, "wh-2": 10 } },
    { id: "p4", name: "Cardboard Box L", sku: "PKG-BOX-L", category: "Packaging", uom: "pcs", reorderPoint: 100, stock: { "wh-main": 60, "wh-prod": 0, "wh-2": 20 } },
    { id: "p5", name: "Machine Oil 5L", sku: "CNS-OIL-5L", category: "Consumables", uom: "l", reorderPoint: 20, stock: { "wh-main": 8, "wh-prod": 2, "wh-2": 0 } },
    { id: "p6", name: "Aluminium Sheet 2mm", sku: "STL-ALU-2", category: "Raw Materials", uom: "kg", reorderPoint: 150, stock: { "wh-main": 310, "wh-prod": 40, "wh-2": 90 } },
    { id: "p7", name: "Chair Cushion Set", sku: "FUR-CSN-STD", category: "Finished Goods", uom: "pcs", reorderPoint: 25, stock: { "wh-main": 18, "wh-prod": 4, "wh-2": 0 } },
    { id: "p8", name: "Packing Tape 48mm", sku: "PKG-TPE-48", category: "Packaging", uom: "roll", reorderPoint: 40, stock: { "wh-main": 12, "wh-prod": 5, "wh-2": 8 } },
  ],
  receipts: [
    { id: "RC-1042", supplier: "Sundaram Steel Co.", warehouse: "wh-main", status: "Done", date: "2026-09-18", lines: [{ productId: "p1", qty: 200 }, { productId: "p6", qty: 100 }] },
    { id: "RC-1043", supplier: "Anand Hardware", warehouse: "wh-main", status: "Waiting", date: "2026-09-22", lines: [{ productId: "p2", qty: 1000 }] },
    { id: "RC-1044", supplier: "Chennai Packaging Ltd.", warehouse: "wh-2", status: "Draft", date: "2026-09-25", lines: [{ productId: "p4", qty: 300 }, { productId: "p8", qty: 50 }] },
  ],
  deliveries: [
    { id: "DO-2201", customer: "Vikram Furnishings", warehouse: "wh-main", status: "Done", date: "2026-09-17", lines: [{ productId: "p3", qty: 10 }] },
    { id: "DO-2202", customer: "Metro Retail", warehouse: "wh-main", status: "Ready", date: "2026-09-23", lines: [{ productId: "p7", qty: 8 }, { productId: "p3", qty: 4 }] },
    { id: "DO-2203", customer: "Sunrise Interiors", warehouse: "wh-2", status: "Waiting", date: "2026-09-25", lines: [{ productId: "p3", qty: 6 }] },
  ],
  transfers: [
    { id: "TR-0301", from: "wh-main", to: "wh-prod", status: "Done", date: "2026-09-19", lines: [{ productId: "p1", qty: 60 }] },
    { id: "TR-0302", from: "wh-main", to: "wh-2", status: "Waiting", date: "2026-09-24", lines: [{ productId: "p6", qty: 30 }] },
  ],
  adjustments: [
    { id: "AD-0090", warehouse: "wh-prod", status: "Done", date: "2026-09-20", reason: "Physical count", lines: [{ productId: "p1", counted: 80, expected: 83 }] },
    { id: "AD-0091", warehouse: "wh-main", status: "Draft", date: "2026-09-25", reason: "Damaged goods", lines: [{ productId: "p5", counted: 8, expected: 11 }] },
  ],
  ledger: [
    { id: "L-9001", date: "2026-09-25 09:14", ref: "RC-1042", type: "Receipt", productId: "p1", warehouse: "wh-main", change: 200 },
    { id: "L-9002", date: "2026-09-19 11:02", ref: "TR-0301", type: "Transfer", productId: "p1", warehouse: "wh-prod", change: 60 },
    { id: "L-9003", date: "2026-09-17 15:40", ref: "DO-2201", type: "Delivery", productId: "p3", warehouse: "wh-main", change: -10 },
    { id: "L-9004", date: "2026-09-20 10:05", ref: "AD-0090", type: "Adjustment", productId: "p1", warehouse: "wh-prod", change: -3 },
  ],
  warehouses: [
    { id: "wh-main", name: "Main Warehouse", location: "Chennai, TN", manager: "Raghul S" },
    { id: "wh-prod", name: "Production Floor", location: "Chennai, TN", manager: "Divya K" },
    { id: "wh-2", name: "Warehouse 2", location: "Coimbatore, TN", manager: "Arjun R" },
  ],
  users: [
    { id: "u1", name: "Raghul S", email: "raghul@stocksense.io", password: "password123", role: "Inventory Manager" },
  ],
};

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fall through to reseed
  }
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return JSON.parse(JSON.stringify(seed));
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Simulated network latency so loading states feel real.
export function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getCollection(name) {
  const db = loadDb();
  return db[name] || [];
}

export function setCollection(name, records) {
  const db = loadDb();
  db[name] = records;
  saveDb(db);
  return records;
}

export function resetDb() {
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
}

export function nextId(prefix, existing) {
  const nums = existing
    .map((r) => parseInt(String(r.id).split("-").pop(), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}
