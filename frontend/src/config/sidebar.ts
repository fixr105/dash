import { Inbox, LayoutDashboard, Settings, Wrench } from "lucide-react";

export type SidebarItem = { label: string; to: string; icon: any };

export function getSidebarItems(memberships: Array<{ scope: string; role: string }>): SidebarItem[] {
  const hasNbfcScope = memberships.some((m) => m.scope.startsWith("nbfc:"));
  const hasPlatformScope = memberships.some((m) => m.scope === "platform:dash");

  if (hasNbfcScope) {
    return [
      { label: "Inbox", to: "/inbox", icon: Inbox },
      { label: "Tools", to: "/tools", icon: Wrench },
      { label: "Settings", to: "/settings", icon: Settings },
    ];
  }
  if (hasPlatformScope) {
    return [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
      { label: "Settings", to: "/settings", icon: Settings },
    ];
  }
  return [];
}
