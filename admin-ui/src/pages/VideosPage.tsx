import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { api, type ResourceVideo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { youtubeThumb } from "@/lib/youtube";

type VideoForm = {
  title: string;
  description: string;
  topic: string;
  video_id: string;
  sort_order: number;
};

const emptyForm = (count: number): VideoForm => ({
  title: "",
  description: "",
  topic: "Career Development",
  video_id: "",
  sort_order: count,
});

export function VideosPage() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceVideo | null>(null);
  const [form, setForm] = useState<VideoForm>(emptyForm(0));

  const query = useQuery({
    queryKey: ["resource-videos"],
    queryFn: () => api.resourceVideos(),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.saveResourceVideo(editing?.id ?? null, {
        title: form.title.trim(),
        description: form.description.trim(),
        topic: form.topic.trim() || "Career Development",
        video_id: form.video_id.trim(),
        sort_order: form.sort_order,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-videos"] });
      setOpen(false);
    },
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert(err instanceof Error ? err.message : "Failed to save video");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteResourceVideo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resource-videos"] }),
    onError: (err) => {
      if (handleAuthError(err)) return;
      alert("Failed to delete video");
    },
  });

  if (query.error && handleAuthError(query.error)) return null;

  const videos = query.data || [];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(videos.length));
    setOpen(true);
  }

  function openEdit(video: ResourceVideo) {
    setEditing(video);
    setForm({
      title: video.title,
      description: video.description || "",
      topic: video.topic || "Career Development",
      video_id: video.video_id,
      sort_order: video.sort_order ?? 0,
    });
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Resource Videos"
        description="These videos appear on the website Resources page (Videos tab). Use the YouTube video ID from the video URL."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add video
          </Button>
        }
      />

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          title="No videos yet."
          description="Add one to show on the Resources page."
          action={
            <Button onClick={openCreate}>
              <Plus /> Add video
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src={youtubeThumb(video.video_id)}
                  alt=""
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <CardContent className="space-y-2 p-4">
                <h3 className="font-semibold leading-snug">{video.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {video.topic || "Career Development"} · Order: {video.sort_order ?? 0}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{video.description || "—"}</p>
              </CardContent>
              <CardFooter className="gap-2 p-4 pt-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(video)}>
                  <Pencil /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Remove this video from the Resources page?")) {
                      deleteMutation.mutate(video.id);
                    }
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit video" : "Add video"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <Field label="Topic" value={form.topic} onChange={(v) => setForm({ ...form, topic: v })} />
            <Field
              label="YouTube Video ID"
              value={form.video_id}
              onChange={(v) => setForm({ ...form, video_id: v })}
              placeholder="e.g. dQw4w9WgXcQ"
            />
            <Field
              label="Sort order"
              type="number"
              value={String(form.sort_order)}
              onChange={(v) => setForm({ ...form, sort_order: parseInt(v, 10) || 0 })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.title.trim() || !form.video_id.trim() || saveMutation.isPending}
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

function Field({
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
