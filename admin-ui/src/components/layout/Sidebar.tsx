import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  FileDown,
  FileText,
  GraduationCap,
  Heart,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/mails", label: "Mails", icon: Inbox },
  { to: "/donations", label: "Donations", icon: Wallet },
  { to: "/campaigns", label: "Campaigns", icon: HeartHandshake },
  { to: "/videos", label: "Videos", icon: Video },
  { to: "/career-guides", label: "Career Guides", icon: BookOpen },
  { to: "/annual-reports", label: "Annual Reports", icon: FileDown },
  { to: "/mentor-resources", label: "For Mentors", icon: FileText },
  { to: "/course-signups", label: "Course Signups", icon: GraduationCap },
  { to: "/team", label: "Team", icon: Users },
];

export function Sidebar({ mobileOpen, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const reduce = useReducedMotion();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-panel transition-transform duration-300 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="border-b border-sidebar-border px-6 py-5">
        <BrandLogo />
        <p className="mt-2 text-xs font-medium text-muted-foreground">Admin Portal</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reduce ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-sidebar-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <item.icon className="relative z-10 size-4 shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Heart className="size-3.5 text-primary" />
          <span>Managing impact across programs</span>
        </div>
      </div>
    </aside>
  );
}

export { navItems };
