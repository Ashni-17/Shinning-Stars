import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim disabled:opacity-60";
const labelClass = "text-sm text-muted block mb-1.5";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="My profile" description="Your account details for StockSense." />
      <div className="bg-surface border border-border p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 bg-surface2 border border-border flex items-center justify-center font-display text-2xl text-accent">
            {(user?.name || "?").slice(0, 1)}
          </div>
          <div>
            <p className="font-display text-2xl leading-none">{user?.name}</p>
            <p className="text-sm text-muted mt-1">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {saved && <p className="text-sm text-success bg-success/10 border border-success/30 px-3 py-2">Profile updated.</p>}
          <div>
            <label className={labelClass}>Full name</label>
            <input className={inputClass} defaultValue={user?.name} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} defaultValue={user?.email} disabled />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <input className={inputClass} defaultValue={user?.role} disabled />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>

      <div className="bg-surface border border-border p-6">
        <p className="font-display text-xl mb-1">Sign out</p>
        <p className="text-sm text-muted mb-4">End your StockSense session on this device.</p>
        <Button variant="danger" onClick={handleLogout}>Log out</Button>
      </div>
    </div>
  );
}
