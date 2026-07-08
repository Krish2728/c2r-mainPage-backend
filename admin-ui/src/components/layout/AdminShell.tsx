import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AdminShell() {
  const { adminName, adminInitials, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden cursor-pointer"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </Button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin
                </p>
                <p className="text-sm font-medium text-foreground">{adminName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-xs font-bold text-white">
                  {adminInitials}
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={logout}>
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className={cn("px-4 py-6 sm:px-6 lg:px-8 lg:py-8")}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
