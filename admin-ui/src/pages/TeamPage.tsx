import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, FolderPlus, Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, Skeleton } from "@/components/ui/skeleton";
import { api, type TeamCategory, type TeamMember } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function panelLabel(member: TeamMember) {
  if (member.panelType === "core") return "Core team";
  return member.categoryTitle || "Advisory";
}

export function TeamPage() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuth();
  const [memberOpen, setMemberOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingCategory, setEditingCategory] = useState<TeamCategory | null>(null);

  const membersQuery = useQuery({ queryKey: ["team-members"], queryFn: () => api.teamMembers() });
  const categoriesQuery = useQuery({ queryKey: ["team-categories"], queryFn: () => api.teamCategories() });

  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    bio: "",
    linkedinUrl: "",
    photoUrl: "",
    photoClass: "",
    panelType: "core" as "core" | "advisory",
    categoryId: "",
    status: "published" as "published" | "draft",
  });

  const [categoryForm, setCategoryForm] = useState({ title: "", isAdditional: false });

  const invalidateTeam = () => {
    queryClient.invalidateQueries({ queryKey: ["team-members"] });
    queryClient.invalidateQueries({ queryKey: ["team-categories"] });
  };

  const saveMemberMutation = useMutation({
    mutationFn: () =>
      api.saveTeamMember(editingMember?.id ?? null, {
        name: memberForm.name.trim(),
        role: memberForm.role.trim(),
        bio: memberForm.bio.trim(),
        linkedinUrl: memberForm.linkedinUrl.trim(),
        photoUrl: memberForm.photoUrl.trim(),
        photoClass: memberForm.photoClass.trim(),
        panelType: memberForm.panelType,
        categoryId: memberForm.panelType === "advisory" ? parseInt(memberForm.categoryId, 10) : null,
        status: memberForm.status,
      }),
    onSuccess: () => {
      invalidateTeam();
      setMemberOpen(false);
    },
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert(err instanceof Error ? err.message : "Failed to save");
    },
  });

  const saveCategoryMutation = useMutation({
    mutationFn: () =>
      api.saveTeamCategory(editingCategory?.id ?? null, {
        title: categoryForm.title.trim(),
        isAdditional: categoryForm.isAdditional,
      }),
    onSuccess: () => {
      invalidateTeam();
      setCategoryOpen(false);
    },
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert(err instanceof Error ? err.message : "Failed to save section");
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: number) => api.deleteTeamMember(id),
    onSuccess: invalidateTeam,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => api.deleteTeamCategory(id),
    onSuccess: invalidateTeam,
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  const moveMemberMutation = useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: "up" | "down" }) =>
      api.moveTeamMember(id, direction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members"] }),
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert(err instanceof Error ? err.message : "Failed to reorder member");
    },
  });

  const moveCategoryMutation = useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: "up" | "down" }) =>
      api.moveTeamCategory(id, direction),
    onSuccess: invalidateTeam,
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert(err instanceof Error ? err.message : "Failed to reorder section");
    },
  });

  if (
    (membersQuery.error && handleAuthError(membersQuery.error)) ||
    (categoriesQuery.error && handleAuthError(categoriesQuery.error))
  ) {
    return null;
  }

  const members = membersQuery.data || [];
  const categories = categoriesQuery.data || [];

  const groupedMembers = useMemo(() => {
    const groups: Record<string, { label: string; items: TeamMember[] }> = {};
    members.forEach((m) => {
      const key = m.panelType === "core" ? "core" : `cat:${m.categoryId || "none"}`;
      if (!groups[key]) groups[key] = { label: panelLabel(m), items: [] };
      groups[key].items.push(m);
    });
    return Object.values(groups);
  }, [members]);

  function openMemberModal(member: TeamMember | null) {
    setEditingMember(member);
    setMemberForm({
      name: member?.name || "",
      role: member?.role || "",
      bio: member?.bio || "",
      linkedinUrl: member?.linkedinUrl || "",
      photoUrl: member?.photoUrl || "",
      photoClass: member?.photoClass || "",
      panelType: member?.panelType || "core",
      categoryId: member?.categoryId ? String(member.categoryId) : categories[0] ? String(categories[0].id) : "",
      status: member?.status === "draft" ? "draft" : "published",
    });
    setMemberOpen(true);
  }

  function openCategoryModal(category: TeamCategory | null) {
    setEditingCategory(category);
    setCategoryForm({
      title: category?.title || "",
      isAdditional: !!category?.isAdditional,
    });
    setCategoryOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Our Team page"
        description="Manage core team and advisory panel members on /our-team. Use photo URLs (site path or https)."
        actions={
          <>
            <Button variant="secondary" onClick={() => openCategoryModal(null)}>
              <FolderPlus /> New section
            </Button>
            <Button onClick={() => openMemberModal(null)}>
              <UserPlus /> New member
            </Button>
          </>
        }
      />

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          {membersQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : members.length === 0 ? (
            <EmptyState title="No team members yet." />
          ) : (
            <div className="space-y-6">
              {groupedMembers.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="space-y-2 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold">{member.name}</h4>
                            <Badge variant={member.status === "published" ? "success" : "warning"}>
                              {member.status === "published" ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </CardContent>
                        <CardFooter className="flex-wrap gap-2 p-4 pt-0">
                          <Button variant="outline" size="icon" onClick={() => moveMemberMutation.mutate({ id: member.id, direction: "up" })}>
                            <ArrowUp />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => moveMemberMutation.mutate({ id: member.id, direction: "down" })}>
                            <ArrowDown />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openMemberModal(member)}>
                            <Pencil /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this team member?")) deleteMemberMutation.mutate(member.id);
                            }}
                          >
                            <Trash2 /> Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sections">
          {categoriesQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : categories.length === 0 ? (
            <EmptyState title="No advisory sections yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((cat) => (
                <Card key={cat.id}>
                  <CardContent className="space-y-2 p-4">
                    <h4 className="font-semibold">{cat.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {cat.isAdditional ? "Additional advisors" : "Advisory section"} · Order: {cat.sortOrder ?? 0}
                    </p>
                  </CardContent>
                  <CardFooter className="flex-wrap gap-2 p-4 pt-0">
                    <Button variant="outline" size="icon" onClick={() => moveCategoryMutation.mutate({ id: cat.id, direction: "up" })}>
                      <ArrowUp />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => moveCategoryMutation.mutate({ id: cat.id, direction: "down" })}>
                      <ArrowDown />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openCategoryModal(cat)}>
                      <Pencil /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this section?")) deleteCategoryMutation.mutate(cat.id);
                      }}
                    >
                      <Trash2 /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Edit team member" : "Add team member"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Name *" value={memberForm.name} onChange={(v) => setMemberForm({ ...memberForm, name: v })} />
            <Field label="Title / role *" value={memberForm.role} onChange={(v) => setMemberForm({ ...memberForm, role: v })} />
            <div className="space-y-2">
              <Label>Panel *</Label>
              <Select
                value={memberForm.panelType}
                onValueChange={(v: "core" | "advisory") => setMemberForm({ ...memberForm, panelType: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core team</SelectItem>
                  <SelectItem value="advisory">Advisory panel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {memberForm.panelType === "advisory" ? (
              <div className="space-y-2">
                <Label>Advisory section *</Label>
                <Select value={memberForm.categoryId} onValueChange={(v) => setMemberForm({ ...memberForm, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.title}
                        {c.isAdditional ? " (additional)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <Field label="LinkedIn URL" value={memberForm.linkedinUrl} onChange={(v) => setMemberForm({ ...memberForm, linkedinUrl: v })} />
            <Field label="Profile photo URL" value={memberForm.photoUrl} onChange={(v) => setMemberForm({ ...memberForm, photoUrl: v })} />
            <Field label="Photo CSS class (optional)" value={memberForm.photoClass} onChange={(v) => setMemberForm({ ...memberForm, photoClass: v })} />
            <div className="space-y-2">
              <Label>Bio / summary *</Label>
              <Textarea rows={5} value={memberForm.bio} onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={memberForm.status} onValueChange={(v: "published" | "draft") => setMemberForm({ ...memberForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberOpen(false)}>Cancel</Button>
            <Button
              disabled={!memberForm.name.trim() || !memberForm.role.trim() || !memberForm.bio.trim() || saveMemberMutation.isPending}
              onClick={() => saveMemberMutation.mutate()}
            >
              {saveMemberMutation.isPending ? <Loader2 className="animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit section" : "New advisory section"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Section title *" value={categoryForm.title} onChange={(v) => setCategoryForm({ ...categoryForm, title: v })} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={categoryForm.isAdditional}
                onCheckedChange={(v) => setCategoryForm({ ...categoryForm, isAdditional: !!v })}
              />
              Additional advisors bucket (uncategorized list)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryOpen(false)}>Cancel</Button>
            <Button
              disabled={!categoryForm.title.trim() || saveCategoryMutation.isPending}
              onClick={() => saveCategoryMutation.mutate()}
            >
              {saveCategoryMutation.isPending ? <Loader2 className="animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
