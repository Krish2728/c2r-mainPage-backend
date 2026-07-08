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
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export function CourseSignupsPage() {
  const { handleAuthError } = useAuth();
  const query = useQuery({
    queryKey: ["course-signups"],
    queryFn: () => api.courseSignups(),
  });

  if (query.error && handleAuthError(query.error)) return null;

  const items = query.data || [];

  return (
    <div>
      <PageHeader
        title="Free course signups"
        description="People who signed up or signed in to access free courses on the Resources page."
      />

      {query.isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState title="No signups yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Mobile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((s, index) => (
              <TableRow key={`${s.email}-${index}`}>
                <TableCell>{formatDate(s.created_at)}</TableCell>
                <TableCell>{s.name || "—"}</TableCell>
                <TableCell>{s.email || "—"}</TableCell>
                <TableCell>{s.age != null ? s.age : "—"}</TableCell>
                <TableCell>{s.mobile_number || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
