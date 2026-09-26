import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as authService from "../../services/authService";
import Button from "../../components/Button";
import AuthLayout from "./AuthLayout";
import { isOtp } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim text-center tracking-[0.5em] font-display text-2xl";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isOtp(otp)) return setError("Enter the 6-digit code.");
    setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Enter verification code" subtitle={email ? `Sent to ${email} (demo code: 123456)` : "Check your email for the code."}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <input
          maxLength={6}
          className={inputClass}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying…" : "Verify code"}
        </Button>
        <p className="text-sm text-muted text-center pt-2">
          <Link to="/forgot-password" className="text-accent hover:underline">
            Resend code
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
