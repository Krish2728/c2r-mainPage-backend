import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, Skeleton } from "@/components/ui/skeleton";
import { api, type CareerGuide } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function CareerGuidesPage() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CareerGuide | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "Career Prep", pdf_url: "", sort_order: 0 });

  const query = useQuery({ queryKey: ["career-guides"], queryFn: () => api.careerGuides() });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.saveCareerGuide(editing?.id ?? null, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "Career Prep",
        pdf_url: form.pdf_url.trim(),
        sort_order: form.sort_order,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-guides"] });
      setOpen(false);
    },
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert("Failed to save");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCareerGuide(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["career-guides"] }),
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert("Failed to delete");
    },
  });

  if (query.error && handleAuthError(query.error)) return null;
  const items = query.data || [];

  return (
    <ResourcePageShell
      title="Career Guides"
      description="PDFs shown on the website Resources page → Career Guides. Use a public link (e.g. Google Drive, Dropbox)."
      loading={query.isLoading}
      empty={items.length === 0}
      emptyTitle="No career guides yet."
      onAdd={() => {
        setEditing(null);
        setForm({ title: "", description: "", category: "Career Prep", pdf_url: "", sort_order: items.length });
        setOpen(true);
      }}
      items={items.map((g) => (
        <Card key={g.id}>
          <CardContent className="space-y-2 p-4">
            <h3 className="font-semibold">{g.title}</h3>
            <p className="text-xs text-muted-foreground">
              {g.category || "Career Prep"} · Order: {g.sort_order ?? 0}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{g.description || "—"}</p>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 p-4 pt-0">
            <Button variant="outline" size="sm" asChild>
              <a href={g.pdf_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> PDF
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(g);
                setForm({
                  title: g.title,
                  description: g.description || "",
                  category: g.category || "Career Prep",
                  pdf_url: g.pdf_url,
                  sort_order: g.sort_order ?? 0,
                });
                setOpen(true);
              }}
            >
              <Pencil /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirm("Remove this career guide?") && deleteMutation.mutate(g.id)}
            >
              <Trash2 /> Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit career guide" : "Add career guide"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <FormField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <FormField label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
              <FormField label="PDF URL" value={form.pdf_url} onChange={(v) => setForm({ ...form, pdf_url: v })} placeholder="https://..." />
              <FormField label="Sort order" type="number" value={String(form.sort_order)} onChange={(v) => setForm({ ...form, sort_order: parseInt(v, 10) || 0 })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!form.title.trim() || !form.pdf_url.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

export function AnnualReportsPage() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; year: string; title: string; description?: string; pdf_url: string; sort_order?: number } | null>(null);
  const [form, setForm] = useState({ year: String(new Date().getFullYear()), title: "", description: "", pdf_url: "", sort_order: 0 });

  const query = useQuery({ queryKey: ["annual-reports"], queryFn: () => api.annualReports() });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.saveAnnualReport(editing?.id ?? null, {
        year: form.year.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        pdf_url: form.pdf_url.trim(),
        sort_order: form.sort_order,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-reports"] });
      setOpen(false);
    },
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert("Failed to save");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAnnualReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["annual-reports"] }),
  });

  if (query.error && handleAuthError(query.error)) return null;
  const items = query.data || [];

  return (
    <ResourcePageShell
      title="Annual Reports"
      description="PDFs shown on Resources → Annual Reports. Use a public link to the report."
      loading={query.isLoading}
      empty={items.length === 0}
      emptyTitle="No annual reports yet."
      onAdd={() => {
        setEditing(null);
        setForm({ year: String(new Date().getFullYear()), title: "", description: "", pdf_url: "", sort_order: items.length });
        setOpen(true);
      }}
      items={items.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 p-4">
            <h3 className="font-semibold">
              {r.year} – {r.title}
            </h3>
            <p className="text-xs text-muted-foreground">Order: {r.sort_order ?? 0}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{r.description || "—"}</p>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 p-4 pt-0">
            <Button variant="outline" size="sm" asChild>
              <a href={r.pdf_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> PDF
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditing(r); setForm({ year: r.year, title: r.title, description: r.description || "", pdf_url: r.pdf_url, sort_order: r.sort_order ?? 0 }); setOpen(true); }}>
              <Pencil /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => confirm("Remove this annual report?") && deleteMutation.mutate(r.id)}>
              <Trash2 /> Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit annual report" : "Add annual report"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
              <FormField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <FormField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <FormField label="PDF URL" value={form.pdf_url} onChange={(v) => setForm({ ...form, pdf_url: v })} />
              <FormField label="Sort order" type="number" value={String(form.sort_order)} onChange={(v) => setForm({ ...form, sort_order: parseInt(v, 10) || 0 })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!form.title.trim() || !form.pdf_url.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

export function MentorResourcesPage() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; title: string; description?: string; pdf_url: string; sort_order?: number } | null>(null);
  const [form, setForm] = useState({ title: "", description: "", pdf_url: "", sort_order: 0 });

  const query = useQuery({ queryKey: ["mentor-resources"], queryFn: () => api.mentorResources() });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.saveMentorResource(editing?.id ?? null, {
        title: form.title.trim(),
        description: form.description.trim(),
        pdf_url: form.pdf_url.trim(),
        sort_order: form.sort_order,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-resources"] });
      setOpen(false);
    },
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert("Failed to save");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteMentorResource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentor-resources"] }),
  });

  if (query.error && handleAuthError(query.error)) return null;
  const items = query.data || [];

  return (
    <ResourcePageShell
      title="Resources for Mentors"
      description="PDFs shown on Resources → For Mentors. Use a public link to the resource."
      loading={query.isLoading}
      empty={items.length === 0}
      emptyTitle="No mentor resources yet."
      onAdd={() => {
        setEditing(null);
        setForm({ title: "", description: "", pdf_url: "", sort_order: items.length });
        setOpen(true);
      }}
      items={items.map((m) => (
        <Card key={m.id}>
          <CardContent className="space-y-2 p-4">
            <h3 className="font-semibold">{m.title}</h3>
            <p className="text-xs text-muted-foreground">Order: {m.sort_order ?? 0}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{m.description || "—"}</p>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 p-4 pt-0">
            <Button variant="outline" size="sm" asChild>
              <a href={m.pdf_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> PDF
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditing(m); setForm({ title: m.title, description: m.description || "", pdf_url: m.pdf_url, sort_order: m.sort_order ?? 0 }); setOpen(true); }}>
              <Pencil /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => confirm("Remove this mentor resource?") && deleteMutation.mutate(m.id)}>
              <Trash2 /> Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit mentor resource" : "Add mentor resource"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <FormField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <FormField label="PDF URL" value={form.pdf_url} onChange={(v) => setForm({ ...form, pdf_url: v })} />
              <FormField label="Sort order" type="number" value={String(form.sort_order)} onChange={(v) => setForm({ ...form, sort_order: parseInt(v, 10) || 0 })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!form.title.trim() || !form.pdf_url.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

function ResourcePageShell({
  title,
  description,
  loading,
  empty,
  emptyTitle,
  onAdd,
  items,
  dialog,
}: {
  title: string;
  description: string;
  loading: boolean;
  empty: boolean;
  emptyTitle: string;
  onAdd: () => void;
  items: React.ReactNode;
  dialog: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={onAdd}>
            <Plus /> Add
          </Button>
        }
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : empty ? (
        <EmptyState title={emptyTitle} action={<Button onClick={onAdd}><Plus /> Add</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items}</div>
      )}
      {dialog}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
