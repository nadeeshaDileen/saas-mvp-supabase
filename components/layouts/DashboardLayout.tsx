"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Building2, Package, ShoppingBag, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentProfile } from "@/hooks/queries/useProfile";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/inventory", label: "Inventory", icon: Layers },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: profile } = useCurrentProfile();
  const { selectedOrganization, organizations, selectOrganization } = useOrganizationContext();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="border-border bg-card flex w-60 flex-col border-r">
        <div className="border-border flex items-center gap-2 border-b p-4">
          <Building2 className="h-5 w-5" />
          <span className="font-semibold">{selectedOrganization?.name ?? "SaaS MVP"}</span>
        </div>

        {/* Org switcher */}
        {organizations.length > 1 && (
          <div className="border-border border-b p-2">
            <select
              className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
              value={selectedOrganization?.id ?? ""}
              onChange={(e) => selectOrganization(e.target.value)}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                (href === "/dashboard" ? pathname === href : pathname.startsWith(href))
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-border flex items-center gap-3 border-t p-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {profile?.fullName ? getInitials(profile.fullName) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.fullName ?? "User"}</p>
            <p className="text-muted-foreground truncate text-xs">{profile?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
