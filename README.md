# Shorts API test — RapidAPI (YTStream) version

This replaces the cPanel-backed proxy with one that calls YTStream on RapidAPI.
The heavy work happens on RapidAPI's servers, so it's fast regardless of your host.

## Vercel environment variables

| Name | Value |
|---|---|
| `RAPIDAPI_KEY`  | your x-rapidapi-key from the RapidAPI dashboard |
| `RAPIDAPI_HOST` | ytstream-download-youtube-videos.p.rapidapi.com |

Add both, tick all three environments, then Deployments -> Redeploy.

## How it differs from the cPanel version

- Browser calls `/api/proxy?url=<link>` (a GET, no polling).
- The function extracts the video id, calls YTStream `/dl?id=`, and returns a
  list of direct download URLs.
- Downloads come straight from Google's CDN to the browser — nothing streams
  through your server, which is why there's no "slow second hop".

## Security

- The RapidAPI key stays server-side in the function; the browser never sees it.
- Rotate the key in the RapidAPI dashboard if it's ever exposed.
- Free tiers have low request limits — check your plan before sharing the URL.
