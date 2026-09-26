import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";
import AuthLayout from "./AuthLayout";
import { isEmail, isRequired, minLength } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isRequired(form.name)) return setError("Enter your full name.");
    if (!isEmail(form.email)) return setError("Enter a valid email address.");
    if (!minLength(form.password, 8)) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Set up StockSense for your warehouse team.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div>
          <label className="text-sm text-muted block mb-1.5">Full name</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Raghul S"
          />
        </div>
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
          <label className="text-sm text-muted block mb-1.5">Password</label>
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-sm text-muted text-center pt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
