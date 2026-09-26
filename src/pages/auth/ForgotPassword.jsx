import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authService from "../../services/authService";
import Button from "../../components/Button";
import AuthLayout from "./AuthLayout";
import { isEmail } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isEmail(email)) return setError("Enter a valid email address.");
    setLoading(true);
    try {
      await authService.requestOtp(email);
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send a one-time code to your email.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div>
          <label className="text-sm text-muted block mb-1.5">Email</label>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending code…" : "Send code"}
        </Button>
        <p className="text-sm text-muted text-center pt-2">
          Remembered it?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
