import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ title, lowStockCount = 0 }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-border bg-bg flex items-center justify-between px-6 sticky top-0 z-20">
      <p className="text-sm text-muted">{title}</p>

      <div className="flex items-center gap-5">
        <button
          onClick={() => navigate("/dashboard")}
          className="relative text-muted hover:text-text"
          aria-label="Low stock alerts"
        >
          <Bell size={19} />
          {lowStockCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-accent text-bg text-[10px] leading-none h-4 w-4 flex items-center justify-center font-medium">
              {lowStockCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 text-sm hover:text-accent"
          >
            <span className="h-8 w-8 bg-surface2 border border-border flex items-center justify-center text-xs font-medium">
              {(user?.name || "?").slice(0, 1)}
            </span>
            <span className="hidden sm:block">{user?.name}</span>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-borderLight py-1 shadow-xl">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-surface2"
              >
                <UserIcon size={15} /> My profile
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                  navigate("/login");
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-danger hover:bg-surface2"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
