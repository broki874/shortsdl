# Shorts API test page (Vercel)

Two files. A static page, and one serverless function that holds your API key so
it never reaches the browser.

```
index.html      the page
api/proxy.js     forwards requests to your API, adds the key
```

## Before you deploy: your API must be reachable

This page needs the **API build** running somewhere with a public URL — the
`shorts-downloader-api.zip` deployment. Confirm it works first by opening its
health URL in a browser:

```
https://yourdomain.com/api/v1/health
```

You should see `"status": "up"`. If not, fix that before continuing — this page
can't work without it.

## Deploy

1. Go to vercel.com, sign in (GitHub login is easiest).
2. **Add New → Project**. Either:
   - drag this folder in, or
   - push it to a GitHub repo and import it.
3. Before clicking Deploy, open **Environment Variables** and add two:

   | Name | Value |
   |---|---|
   | `API_BASE` | `https://yourdomain.com/api` (no trailing slash) |
   | `API_KEY` | one of the keys you set in `API_KEYS` on the API server |

4. Click **Deploy**. You get a URL like `your-project.vercel.app`.

That's it. Open the URL, paste a Shorts link, hit Download.

## If you change the env vars later

Vercel only applies env vars at build time. After editing them, go to
**Deployments → … → Redeploy** or the change won't take effect.

## Troubleshooting

- **"Server missing API_BASE or API_KEY"** → you didn't set the env vars, or
  didn't redeploy after setting them.
- **"Could not reach API"** → `API_BASE` is wrong, or your API server is down.
  Test its `/v1/health` URL directly.
- **"Missing or invalid API key"** → `API_KEY` here doesn't match a key in
  `API_KEYS` on the server.
- **Stuck on "extracting"** for a long time → that's the API server being slow
  (shared-hosting CPU), not this page. It's the same slowness you saw in the UI.
- **Times out** → Vercel free functions cap at 60s. A slow download on the API
  side can exceed that. It means the API is too slow on that host, not that the
  wiring is broken.

## Reminder about what this is

This is a **test harness**, not a public product. It's fine to hand the Vercel
URL to yourself or a couple of people. But anyone with the URL can run downloads
through your one API key — there's no per-user limit here. If this ever becomes
something real, you'd want per-user keys or accounts, and you'd want the API on a
VPS rather than shared hosting, for the reasons already discussed.
