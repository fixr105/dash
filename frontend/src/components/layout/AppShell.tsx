import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import { getSidebarItems } from "../../config/sidebar";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const items = useMemo(() => getSidebarItems(user?.memberships ?? []), [user?.memberships]);

  if (!user) {
    return null;
  }

  return (
    <div className="shell">
      <Sidebar items={items} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="shell-content">
        <TopBar user={user} onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
