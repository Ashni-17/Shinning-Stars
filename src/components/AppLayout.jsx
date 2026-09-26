import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getLowStockProducts } from "../services/dashboardService";

const TITLES = {
  "/dashboard": "Overview",
  "/products": "Product catalog",
  "/receipts": "Incoming stock",
  "/deliveries": "Outgoing stock",
  "/transfers": "Internal transfers",
  "/adjustments": "Stock adjustments",
  "/history": "Stock ledger",
  "/settings/warehouse": "Warehouse settings",
  "/profile": "My profile",
};

export default function AppLayout() {
  const location = useLocation();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    getLowStockProducts().then((list) => setLowStockCount(list.length));
  }, [location.pathname]);

  const base = "/" + location.pathname.split("/").slice(1, 2).join("/");
  const title = TITLES[location.pathname] || TITLES[base] || "StockSense";

  return (
    <div className="flex min-h-screen bg-bg text-text font-body">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Navbar title={title} lowStockCount={lowStockCount} />
        <main className="px-6 py-6 max-w-[1400px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
