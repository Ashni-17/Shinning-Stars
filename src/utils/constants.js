export const DOC_TYPES = ["Receipt", "Delivery", "Transfer", "Adjustment"];

export const STATUSES = ["Draft", "Waiting", "Ready", "Done", "Canceled"];

export const STATUS_COLORS = {
  Draft: "dim",
  Waiting: "accent",
  Ready: "info",
  Done: "success",
  Canceled: "danger",
};

export const WAREHOUSES = [
  { id: "wh-main", name: "Main Warehouse", location: "Chennai, TN" },
  { id: "wh-prod", name: "Production Floor", location: "Chennai, TN" },
  { id: "wh-2", name: "Warehouse 2", location: "Coimbatore, TN" },
];

export const CATEGORIES = [
  "Raw Materials",
  "Components",
  "Finished Goods",
  "Packaging",
  "Consumables",
];

export const UNITS = ["pcs", "kg", "g", "l", "ml", "box", "roll", "m"];
