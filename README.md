# Shorts downloader — RapidAPI (YTStream), forced-download version

Same as before, but clicking a button now SAVES the file instead of opening it
in a browser tab.

## Vercel environment variables
| Name | Value |
|---|---|
| `RAPIDAPI_KEY`  | your x-rapidapi-key |
| `RAPIDAPI_HOST` | ytstream-download-youtube-videos.p.rapidapi.com |

Set both, tick all environments, then Deployments -> Redeploy.

## How the download works now
- Getting links is unchanged: browser -> /api/proxy?url=... -> YTStream.
- The download buttons point at /api/proxy?save=1&src=<googlevideo url>, which
  fetches the file and re-sends it with a Content-Disposition: attachment header.
  That header is what makes the browser save rather than play.

## Trade-off to know
- The file now passes THROUGH your Vercel function, so it's a little slower than
  the raw direct link and counts against Vercel's function time/size limits
  (fine for short Shorts; long videos may hit the ceiling).
- If you'd rather have raw speed and don't mind the "opens in a tab, right-click
  to save" behaviour, revert the buttons to use d.best.url directly.

## Security
- The save endpoint ONLY proxies googlevideo.com URLs, so it can't be abused to
  fetch arbitrary sites through your function.
- The RapidAPI key stays server-side. Rotate it if exposed.
