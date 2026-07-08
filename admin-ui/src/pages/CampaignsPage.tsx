import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, Skeleton } from "@/components/ui/skeleton";
import {
  api,
  CAMPAIGN_SECTIONS,
  campaignSectionLabel,
  type CampaignDetail,
  type CampaignSummary,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

type CampaignForm = {
  title: string;
  slug: string;
  short_description: string;
  full_story: string;
  cover_image_url: string;
  category: string;
  location: string;
  beneficiary_label: string;
  goal_amount: number;
  preset_amounts: string;
  is_urgent: boolean;
  is_featured: boolean;
};

const emptyCampaignForm = (): CampaignForm => ({
  title: "",
  slug: "",
  short_description: "",
  full_story: "",
  cover_image_url: "",
  category: "education",
  location: "",
  beneficiary_label: "",
  goal_amount: 50000,
  preset_amounts: "",
  is_urgent: false,
  is_featured: false,
});

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuth();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyCampaignForm());
  const [proofTitle, setProofTitle] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const query = useQuery({ queryKey: ["campaigns"], queryFn: () => api.campaigns() });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.saveCampaign(detail?.id ?? null, {
        title: form.title.trim(),
        slug: form.slug.trim(),
        short_description: form.short_description.trim(),
        full_story: form.full_story.trim(),
        cover_image_url: form.cover_image_url.trim(),
        category: form.category.trim() || "education",
        location: form.location.trim(),
        beneficiary_label: form.beneficiary_label.trim(),
        goal_amount_rupees: form.goal_amount,
        preset_amounts: form.preset_amounts,
        is_urgent: form.is_urgent,
        is_featured: form.is_featured,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setOpen(false);
    },
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert("Failed to save campaign");
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => api.publishCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  const addProofMutation = useMutation({
    mutationFn: () =>
      api.addCampaignProof(detail!.id, {
        title: proofTitle.trim(),
        media_url: proofUrl.trim(),
        proof_type: "photo",
      }),
    onSuccess: async () => {
      const refreshed = await api.campaign(detail!.id);
      setDetail(refreshed);
      applyDetail(refreshed);
      setProofTitle("");
      setProofUrl("");
    },
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert("Failed to add proof");
    },
  });

  const deleteProofMutation = useMutation({
    mutationFn: (proofId: number) => api.deleteCampaignProof(proofId),
    onSuccess: async () => {
      const refreshed = await api.campaign(detail!.id);
      setDetail(refreshed);
      applyDetail(refreshed);
    },
  });

  if (query.error && handleAuthError(query.error)) return null;
  const campaigns = query.data || [];

  function applyDetail(campaign: CampaignDetail | null) {
    if (!campaign) {
      setDetail(null);
      setForm(emptyCampaignForm());
      return;
    }
    setDetail(campaign);
    setForm({
      title: campaign.title || "",
      slug: campaign.slug || "",
      short_description: campaign.short_description || "",
      full_story: campaign.full_story || "",
      cover_image_url: campaign.cover_image_url || "",
      category: campaign.category || "education",
      location: campaign.location || "",
      beneficiary_label: campaign.beneficiary_label || "",
      goal_amount: campaign.goal_amount || 50000,
      preset_amounts: (campaign.preset_amounts || [])
        .map((p) => `${p.amount}${p.label ? `|${p.label}` : ""}`)
        .join("\n"),
      is_urgent: !!campaign.is_urgent,
      is_featured: !!campaign.is_featured,
    });
  }

  async function openEdit(summary: CampaignSummary) {
    const full = await api.campaign(summary.id);
    applyDetail(full);
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Donation campaigns"
        description="Create draft campaigns, add proofs, mark urgent, then publish to show on /donate."
        actions={
          <Button
            onClick={() => {
              applyDetail(null);
              setOpen(true);
            }}
          >
            <Plus /> New campaign
          </Button>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet." description="Create one to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{c.title}</h3>
                  <Badge variant={c.status === "published" ? "success" : "warning"}>
                    {c.status === "published" ? "Published" : "Draft"}
                  </Badge>
                  {c.is_urgent ? <Badge variant="destructive">Urgent</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {campaignSectionLabel(c.category)} · {formatCurrency(c.raised_amount || 0)} /{" "}
                  {formatCurrency(c.goal_amount || 0)}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.short_description || ""}</p>
              </CardContent>
              <CardFooter className="flex-wrap gap-2 p-4 pt-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                  <Pencil /> Edit
                </Button>
                {c.status !== "published" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (confirm("Publish this campaign? It will appear on the donate page.")) {
                        publishMutation.mutate(c.id);
                      }
                    }}
                  >
                    <Upload /> Publish
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this campaign?")) deleteMutation.mutate(c.id);
                  }}
                >
                  <Trash2 /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail ? "Edit campaign" : "New campaign"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <FormField label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="auto-generated if empty" />
            <FormField label="Short description" value={form.short_description} onChange={(v) => setForm({ ...form, short_description: v })} />
            <div className="space-y-2">
              <Label>Full story</Label>
              <Textarea rows={4} value={form.full_story} onChange={(e) => setForm({ ...form, full_story: e.target.value })} />
            </div>
            <FormField label="Cover image URL" value={form.cover_image_url} onChange={(v) => setForm({ ...form, cover_image_url: v })} />
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_SECTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose which section this campaign appears under on the donate page. Use &quot;Mark as urgent&quot; to also show on the homepage.
              </p>
            </div>
            <FormField label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            <FormField label="Beneficiary label" value={form.beneficiary_label} onChange={(v) => setForm({ ...form, beneficiary_label: v })} placeholder="e.g. 50 students" />
            <FormField label="Goal amount (₹)" type="number" value={String(form.goal_amount)} onChange={(v) => setForm({ ...form, goal_amount: parseInt(v, 10) || 50000 })} />
            <div className="space-y-2">
              <Label>Preset amounts (one per line: amount|label)</Label>
              <Textarea rows={3} value={form.preset_amounts} onChange={(e) => setForm({ ...form, preset_amounts: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={form.is_urgent} onCheckedChange={(v) => setForm({ ...form, is_urgent: !!v })} />
                Mark as urgent (homepage)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: !!v })} />
                Featured
              </label>
            </div>

            {detail ? (
              <div className="space-y-3 rounded-xl border p-4">
                <h4 className="font-medium">Add proof photo</h4>
                <FormField label="Proof title" value={proofTitle} onChange={setProofTitle} />
                <FormField label="Image URL" value={proofUrl} onChange={setProofUrl} placeholder="https://..." />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!proofTitle.trim() || !proofUrl.trim() || addProofMutation.isPending}
                  onClick={() => addProofMutation.mutate()}
                >
                  Add proof
                </Button>
                <div className="space-y-2 text-sm">
                  {(detail.proofs || []).length === 0 ? (
                    <p className="text-muted-foreground">No proofs yet.</p>
                  ) : (
                    detail.proofs!.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                        <span>{p.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Remove this proof?")) deleteProofMutation.mutate(p.id);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter className="flex-wrap">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {detail && detail.status !== "published" ? (
              <Button
                onClick={() => {
                  if (confirm("Publish this campaign? It will appear on the donate page.")) {
                    publishMutation.mutate(detail.id);
                  }
                }}
              >
                Publish
              </Button>
            ) : null}
            <Button
              disabled={!form.title.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
