// One serverless function. It holds the API key (from Vercel env vars) and
// forwards browser requests to your downloader API, so the key never reaches
// the browser. Set API_BASE and API_KEY in the Vercel dashboard.

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const base = process.env.API_BASE;   // e.g. https://yourdomain.com/api
  const key = process.env.API_KEY;     // one of the keys from API_KEYS

  if (!base || !key) {
    return res.status(500).json({
      ok: false,
      error: { message: "Server missing API_BASE or API_KEY (set them in Vercel > Settings > Environment Variables)." },
    });
  }

  // The browser tells us which API path to hit, e.g. p=/v1/download
  const path = (req.query.p || "").toString();
  if (!path.startsWith("/v1/")) {
    return res.status(400).json({ ok: false, error: { message: "Bad path." } });
  }

  const url = base.replace(/\/+$/, "") + path;
  const headers = { "X-API-Key": key };
  let body;
  if (req.method === "POST") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(req.body || {});
  }

  let upstream;
  try {
    upstream = await fetch(url, { method: req.method, headers, body });
  } catch (e) {
    return res.status(502).json({ ok: false, error: { message: "Could not reach API: " + e.message } });
  }

  const ct = upstream.headers.get("content-type") || "";
  const cd = upstream.headers.get("content-disposition");
  if (cd) res.setHeader("Content-Disposition", cd);
  res.setHeader("Content-Type", ct);

  if (ct.includes("application/json")) {
    return res.status(upstream.status).send(await upstream.text());
  }
  const buf = Buffer.from(await upstream.arrayBuffer());
  return res.status(upstream.status).send(buf);
}
