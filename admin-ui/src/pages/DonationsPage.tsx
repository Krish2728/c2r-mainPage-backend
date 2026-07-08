import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export function DonationsPage() {
  const { handleAuthError } = useAuth();
  const query = useQuery({
    queryKey: ["donations"],
    queryFn: () => api.donations(),
  });

  if (query.error && handleAuthError(query.error)) return null;

  const donations = query.data?.donations || [];

  return (
    <div>
      <PageHeader
        title="Donations"
        description="Successful payments only. Abandoned or incomplete checkouts are not listed."
      />

      {query.isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : donations.length === 0 ? (
        <EmptyState title="No successful donations yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((d, index) => (
              <TableRow key={`${d.donor_email}-${index}`}>
                <TableCell>{formatDate(d.completed_at || d.created_at)}</TableCell>
                <TableCell>{d.donor_name || "—"}</TableCell>
                <TableCell>{d.donor_email || "—"}</TableCell>
                <TableCell>{formatCurrency(d.amount_display || 0)}</TableCell>
                <TableCell>
                  <Badge variant="success">{d.status || "completed"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
