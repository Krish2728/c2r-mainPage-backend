import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Heart, IndianRupee, Mail, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FadeIn } from "@/components/layout/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { navItems } from "@/components/layout/Sidebar";

export function OverviewPage() {
  const { handleAuthError } = useAuth();
  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.stats(),
  });

  if (statsQuery.error && handleAuthError(statsQuery.error)) return null;

  const stats = [
    {
      label: "Total Emails",
      value: statsQuery.data?.totalEmails ?? 0,
      icon: Mail,
      tone: "from-primary to-emerald-700",
    },
    {
      label: "Donations",
      value: statsQuery.data?.totalDonationsCount ?? 0,
      icon: Heart,
      tone: "from-emerald-600 to-green-500",
    },
    {
      label: "Amount",
      value: formatCurrency(statsQuery.data?.totalDonationsAmount || 0),
      icon: IndianRupee,
      tone: "from-amber-600 to-orange-500",
    },
  ];

  const quickLinks = navItems.filter((item) => item.to !== "/");

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Emails, donations, videos, guides, reports & mentor resources at a glance."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <FadeIn key={stat.label} delay={index * 0.05}>
            <Card className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.tone} text-white shadow-sm`}
                >
                  <stat.icon className="size-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-2 h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Quick navigation</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item, index) => (
            <FadeIn key={item.to} delay={0.1 + index * 0.03}>
              <Link
                to={item.to}
                className="group flex items-center justify-between rounded-2xl border bg-card px-4 py-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-soft cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                    <item.icon className="size-4 text-primary" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
