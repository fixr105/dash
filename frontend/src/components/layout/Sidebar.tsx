import { NavLink } from "react-router-dom";

import type { SidebarItem } from "../../config/sidebar";

type SidebarProps = {
  items: SidebarItem[];
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ items, isOpen, onClose }: SidebarProps) {
  return (
    <aside className={`shell-sidebar${isOpen ? " is-open" : ""}`} aria-label="Primary navigation">
      <div className="shell-sidebar__brand">
        <p className="shell-wordmark">Seven Fincorp</p>
        <h1>Dash</h1>
      </div>

      <nav className="shell-sidebar__nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `shell-nav-link${isActive ? " is-active" : ""}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
