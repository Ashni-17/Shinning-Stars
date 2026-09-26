import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";
import AuthLayout from "./AuthLayout";
import { isEmail, isRequired } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "raghul@stocksense.io", password: "password123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isEmail(form.email)) return setError("Enter a valid email address.");
    if (!isRequired(form.password)) return setError("Enter your password.");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Pick up where the floor left off.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div>
          <label className="text-sm text-muted block mb-1.5">Email</label>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-muted">Password</label>
            <Link to="/forgot-password" className="text-sm text-info hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-sm text-muted text-center pt-2">
          New to StockSense?{" "}
          <Link to="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
        <p className="text-xs text-dim text-center pt-1">Demo login is pre-filled — just press Sign in.</p>
      </form>
    </AuthLayout>
  );
}
