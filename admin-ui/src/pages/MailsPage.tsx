import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, Skeleton } from "@/components/ui/skeleton";
import { api, type EmailRecord, type VolunteerRecord } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, truncate } from "@/lib/utils";

function MailBadge({ type }: { type?: string }) {
  const label = (type || "general").replace(/_/g, " ");
  const variant =
    type === "partnership"
      ? "secondary"
      : type === "mentor_application"
        ? "success"
        : type === "volunteer"
          ? "warning"
          : "outline";
  return <Badge variant={variant}>{label}</Badge>;
}

export function MailsPage() {
  const { handleAuthError } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  const generalQuery = useQuery({
    queryKey: ["emails", "general"],
    queryFn: () => api.emails("general"),
  });
  const partnershipQuery = useQuery({
    queryKey: ["emails", "partnership"],
    queryFn: () => api.emails("partnership"),
  });
  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: () => api.volunteers(),
  });

  const queries = [generalQuery, partnershipQuery, volunteersQuery];
  for (const q of queries) {
    if (q.error && handleAuthError(q.error)) return null;
  }

  async function exportExcel() {
    setExporting(true);
    try {
      const res = await api.exportEmails();
      if (res.status === 401) {
        handleAuthError(new Error("401"));
        return;
      }
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "connect2roots-emails.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const volunteerErrorMessage = useMemo(() => {
    if (volunteersQuery.error instanceof Error) return volunteersQuery.error.message;
    if (volunteersQuery.isError) return "Could not load volunteers.";
    return null;
  }, [volunteersQuery.error, volunteersQuery.isError]);

  return (
    <div>
      <PageHeader
        title="Mails"
        description="General inquiries, partnership requests, and volunteering submissions."
        actions={
          <Button onClick={exportExcel} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            Export to Excel
          </Button>
        }
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general">General inquiry</TabsTrigger>
          <TabsTrigger value="partnership">Partnership</TabsTrigger>
          <TabsTrigger value="volunteering">Volunteering</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <EmailTable
            loading={generalQuery.isLoading}
            rows={generalQuery.data?.emails || []}
            empty="No general inquiries yet."
            onSelect={setSelectedEmail}
            columns={[
              { key: "date", label: "Date", render: (e) => formatDate(e.created_at) },
              { key: "name", label: "Name", render: (e) => e.name || "—" },
              { key: "email", label: "Email", render: (e) => e.email || "—" },
              { key: "message", label: "Message", render: (e) => truncate(e.message || "—") },
            ]}
          />
        </TabsContent>

        <TabsContent value="partnership">
          <EmailTable
            loading={partnershipQuery.isLoading}
            rows={partnershipQuery.data?.emails || []}
            empty="No partnership inquiries yet."
            onSelect={setSelectedEmail}
            columns={[
              { key: "date", label: "Date", render: (e) => formatDate(e.created_at) },
              { key: "company", label: "Company", render: (e) => e.company_name || "—" },
              { key: "contact", label: "Contact", render: (e) => e.contact_person || "—" },
              { key: "email", label: "Email", render: (e) => e.email || "—" },
              { key: "message", label: "Message", render: (e) => truncate(e.message || "—") },
            ]}
          />
        </TabsContent>

        <TabsContent value="volunteering">
          {volunteersQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : volunteerErrorMessage ? (
            <EmptyState title="Volunteers unavailable" description={volunteerErrorMessage} />
          ) : (volunteersQuery.data?.volunteers || []).length === 0 ? (
            <EmptyState title="No volunteer submissions yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(volunteersQuery.data?.volunteers || []).map((v, i) => (
                  <TableRow
                    key={`${v.email}-${i}`}
                    className="cursor-pointer"
                    onClick={() => setSelectedVolunteer(v)}
                  >
                    <TableCell>{formatDate(v.created_at)}</TableCell>
                    <TableCell>{v.full_name || "—"}</TableCell>
                    <TableCell>{v.email || "—"}</TableCell>
                    <TableCell>{v.mobile_no || "—"}</TableCell>
                    <TableCell>{truncate(v.how_can_you_contribute || "—", 60)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl">
          {selectedEmail ? (
            <>
              <DialogHeader>
                <DialogTitle className="capitalize">
                  {(selectedEmail.type || "general").replace(/_/g, " ")} message
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <MetaRow label="From" value={`${selectedEmail.name || selectedEmail.contact_person || selectedEmail.company_name || "—"} <${selectedEmail.email}>`} />
                <MetaRow label="Date" value={formatDate(selectedEmail.created_at)} />
                <MetaRow label="Type" value={<MailBadge type={selectedEmail.type} />} />
                {selectedEmail.company_name ? <MetaRow label="Company" value={selectedEmail.company_name} /> : null}
                {selectedEmail.contact_person ? <MetaRow label="Contact" value={selectedEmail.contact_person} /> : null}
                {selectedEmail.profession ? <MetaRow label="Profession" value={selectedEmail.profession} /> : null}
                {selectedEmail.experience ? <MetaRow label="Experience" value={selectedEmail.experience} /> : null}
                <div className="rounded-xl border bg-muted/30 p-4 whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.message || "—"}
                </div>
                {selectedEmail.motivation ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Motivation
                    </p>
                    <div className="rounded-xl border bg-muted/30 p-4 whitespace-pre-wrap">
                      {selectedEmail.motivation}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedVolunteer} onOpenChange={(open) => !open && setSelectedVolunteer(null)}>
        <DialogContent className="max-w-2xl">
          {selectedVolunteer ? (
            <>
              <DialogHeader>
                <DialogTitle>Volunteer – {selectedVolunteer.full_name || selectedVolunteer.email}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                {Object.entries({
                  Date: formatDate(selectedVolunteer.created_at),
                  "Full Name": selectedVolunteer.full_name,
                  Email: selectedVolunteer.email,
                  Gender: selectedVolunteer.gender,
                  Mobile: selectedVolunteer.mobile_no,
                  "Date of Birth": selectedVolunteer.date_of_birth,
                  "Current Address": selectedVolunteer.current_address,
                  "Native City/Village": selectedVolunteer.native_city_village,
                  Languages: selectedVolunteer.languages,
                  "Company/Organisation": selectedVolunteer.current_company_org,
                  Designation: selectedVolunteer.designation,
                  LinkedIn: selectedVolunteer.linkedin_profile,
                  "Years of Experience": selectedVolunteer.years_of_experience,
                  "Volunteered Before": selectedVolunteer.has_volunteered_before,
                  "Highest Qualification": selectedVolunteer.highest_qualification,
                  "How can you contribute": selectedVolunteer.how_can_you_contribute,
                  "Preferred areas": selectedVolunteer.preferred_areas_mentoring,
                  "Hours per week": selectedVolunteer.hours_per_week,
                  "Preferred Days": selectedVolunteer.preferred_days,
                  "Preferred Timings": selectedVolunteer.preferred_timings,
                  "Identity number": selectedVolunteer.identity_number,
                })
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <MetaRow key={label} label={label} value={String(value)} />
                  ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  );
}

function EmailTable<T extends EmailRecord>({
  loading,
  rows,
  empty,
  onSelect,
  columns,
}: {
  loading: boolean;
  rows: T[];
  empty: string;
  onSelect: (row: T) => void;
  columns: { key: string; label: string; render: (row: T) => React.ReactNode }[];
}) {
  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={`${row.email}-${index}`} className="cursor-pointer" onClick={() => onSelect(row)}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
