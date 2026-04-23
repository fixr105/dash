import { Menu, Settings, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { AuthUser } from "../../auth/AuthContext";
import { useAuth } from "../../auth/useAuth";

type TopBarProps = {
  user: AuthUser;
  onMenuToggle: () => void;
};

export function TopBar({ user, onMenuToggle }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="shell-topbar">
      <div className="shell-topbar__left">
        <button type="button" className="shell-menu-button" onClick={onMenuToggle} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
        <p className="shell-wordmark">Seven Fincorp</p>
      </div>

      <div className="shell-user-menu">
        <button type="button" className="shell-user-menu__trigger" onClick={() => setMenuOpen((prev) => !prev)}>
          <span className="shell-avatar" aria-hidden="true">
            {initials || "SF"}
          </span>
          <span className="shell-user-menu__name">{user.name || user.email}</span>
        </button>

        {menuOpen ? (
          <div className="shell-user-menu__dropdown" role="menu">
            <button type="button" className="shell-user-menu__item" onClick={() => setMenuOpen(false)}>
              <UserCircle2 size={16} />
              <span>Profile</span>
            </button>
            <button type="button" className="shell-user-menu__item" onClick={() => setMenuOpen(false)}>
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button type="button" className="shell-user-menu__item is-danger" onClick={() => void handleSignOut()}>
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
