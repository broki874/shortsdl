// Vercel serverless function — talks to YTStream (RapidAPI).
// Holds the RapidAPI key server-side so it never reaches the browser.
//
// Set these in Vercel > Settings > Environment Variables:
//   RAPIDAPI_KEY   your x-rapidapi-key
//   RAPIDAPI_HOST  ytstream-download-youtube-videos.p.rapidapi.com
//
// The browser calls:  /api/proxy?url=<youtube shorts link>

export const config = { maxDuration: 30 };

const VIDEO_ID = /[A-Za-z0-9_-]{11}/;

function videoIdFrom(raw) {
  try {
    const u = new URL((raw || "").trim());
    let host = u.hostname.toLowerCase().replace(/^(www\.|m\.|music\.)/, "");
    const parts = u.pathname.split("/").filter(Boolean);
    let cand = "";
    if (host === "youtu.be") cand = parts[0] || "";
    else if (["shorts", "embed", "v", "live"].includes(parts[0])) cand = parts[1] || "";
    else if (u.pathname === "/watch") cand = u.searchParams.get("v") || "";
    if (!["youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) return null;
    return VIDEO_ID.test(cand) && cand.length === 11 ? cand : null;
  } catch {
    return null;
  }
}

// YTStream nests download links in a few possible arrays. Flatten them,
// keep only entries with a real URL, and tag whether each has audio+video.
function collectFormats(data) {
  const out = [];
  const push = (f, group) => {
    if (!f || !f.url) return;
    out.push({
      url: f.url,
      mimeType: f.mimeType || "",
      quality: f.qualityLabel || f.quality || f.audioQuality || "",
      hasVideo: (f.mimeType || "").startsWith("video"),
      hasAudio: (f.mimeType || "").startsWith("audio") ||
                (group === "muxed"),
      bitrate: f.bitrate || 0,
      contentLength: f.contentLength || null,
    });
  };
  // "formats" are usually muxed (video+audio together) — best for a simple download.
  (data.formats || []).forEach((f) => push(f, "muxed"));
  (data.adaptiveFormats || []).forEach((f) => push(f, "adaptive"));
  return out;
}

export default async function handler(req, res) {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST || "ytstream-download-youtube-videos.p.rapidapi.com";
  if (!key) {
    return res.status(500).json({
      ok: false,
      error: { message: "Server missing RAPIDAPI_KEY (set it in Vercel > Settings > Environment Variables)." },
    });
  }

  const vid = videoIdFrom(req.query.url);
  if (!vid) {
    return res.status(400).json({ ok: false, error: { message: "Not a recognizable YouTube link." } });
  }

  let upstream, data;
  try {
    upstream = await fetch(`https://${host}/dl?id=${vid}`, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": host },
    });
    data = await upstream.json();
  } catch (e) {
    return res.status(502).json({ ok: false, error: { message: "Could not reach YTStream: " + e.message } });
  }

  if (!upstream.ok || data.status === "fail" || data.error) {
    return res.status(502).json({
      ok: false,
      error: { message: data.message || data.error || `YTStream returned ${upstream.status}.` },
    });
  }

  const formats = collectFormats(data);
  if (!formats.length) {
    return res.status(502).json({ ok: false, error: { message: "No downloadable formats returned for this video." } });
  }

  // Pick a sensible default: highest-quality muxed (video+audio) stream.
  const muxed = formats.filter((f) => f.hasVideo && f.hasAudio);
  const best = (muxed.length ? muxed : formats.filter((f) => f.hasVideo))
    .sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0))[0] || formats[0];

  const audio = formats
    .filter((f) => f.hasAudio && !f.hasVideo)
    .sort((a, b) => b.bitrate - a.bitrate)[0] || null;

  return res.status(200).json({
    ok: true,
    data: {
      id: vid,
      title: data.title || "video",
      thumbnail: (data.thumbnail && data.thumbnail[0] && data.thumbnail[0].url) || null,
      lengthSeconds: data.lengthSeconds || null,
      best: best ? { url: best.url, quality: best.quality, mimeType: best.mimeType } : null,
      audio: audio ? { url: audio.url, quality: audio.quality, mimeType: audio.mimeType } : null,
      formats,
    },
  });
}
