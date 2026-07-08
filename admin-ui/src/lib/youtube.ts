export function getYouTubeVideoId(input: string) {
  if (!input) return "";
  const s = input.trim();
  if (/^[\w-]{10,12}$/.test(s)) return s;
  try {
    const short = s.match(/(?:youtu\.be\/)([\w-]+)/);
    if (short) return short[1];
    const url = new URL(s.startsWith("http") ? s : `https://${s}`);
    if (url.hostname.replace("www.", "") === "youtube.com") {
      const v = url.searchParams.get("v");
      if (v) return v;
      const embed = url.pathname.match(/\/embed\/([\w-]+)/);
      if (embed) return embed[1];
    }
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0] || "";
  } catch {
    /* ignore */
  }
  return s;
}

export function youtubeThumb(videoId: string) {
  const id = getYouTubeVideoId(videoId);
  return id ? `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : "";
}
