import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AppLayout from "../components/AppLayout";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOTP from "../pages/auth/VerifyOTP";
import ResetPassword from "../pages/auth/ResetPassword";

import Dashboard from "../pages/dashboard/Dashboard";

import Products from "../pages/products/Products";
import AddProduct from "../pages/products/AddProduct";
import EditProduct from "../pages/products/EditProduct";

import Receipts from "../pages/operations/Receipts";
import CreateReceipt from "../pages/operations/CreateReceipt";
import ReceiptDetails from "../pages/operations/ReceiptDetails";
import Deliveries from "../pages/operations/Deliveries";
import CreateDelivery from "../pages/operations/CreateDelivery";
import DeliveryDetails from "../pages/operations/DeliveryDetails";
import Transfers from "../pages/operations/Transfers";
import CreateTransfer from "../pages/operations/CreateTransfer";
import TransferDetails from "../pages/operations/TransferDetails";

import Adjustments from "../pages/inventory/Adjustments";
import CreateAdjustment from "../pages/inventory/CreateAdjustment";
import AdjustmentDetails from "../pages/inventory/AdjustmentDetails";

import MoveHistory from "../pages/history/MoveHistory";
import WarehouseSettings from "../pages/settings/Warehouse";
import Profile from "../pages/profile/Profile";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* App */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<AddProduct />} />
        <Route path="/products/:id/edit" element={<EditProduct />} />

        <Route path="/receipts" element={<Receipts />} />
        <Route path="/receipts/new" element={<CreateReceipt />} />
        <Route path="/receipts/:id" element={<ReceiptDetails />} />

        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/deliveries/new" element={<CreateDelivery />} />
        <Route path="/deliveries/:id" element={<DeliveryDetails />} />

        <Route path="/transfers" element={<Transfers />} />
        <Route path="/transfers/new" element={<CreateTransfer />} />
        <Route path="/transfers/:id" element={<TransferDetails />} />

        <Route path="/adjustments" element={<Adjustments />} />
        <Route path="/adjustments/new" element={<CreateAdjustment />} />
        <Route path="/adjustments/:id" element={<AdjustmentDetails />} />

        <Route path="/history" element={<MoveHistory />} />
        <Route path="/settings/warehouse" element={<WarehouseSettings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
