# Shorts downloader — RapidAPI (YTStream), client-side save

Fast direct download from Google's CDN, and clicking a button SAVES the file
instead of playing it in a tab.

## Vercel environment variables
| Name | Value |
|---|---|
| `RAPIDAPI_KEY`  | your x-rapidapi-key |
| `RAPIDAPI_HOST` | ytstream-download-youtube-videos.p.rapidapi.com |

Set both, tick all environments, then Deployments -> Redeploy.

## Why it works this way (important)
Google's download links are locked to the IP that will fetch them. That IP is
the END USER'S browser, not your server. So the file MUST be fetched client-side:
- The proxy is only used to GET the links from YTStream (small JSON).
- The browser then fetches the actual video from googlevideo.com itself and
  saves it via a blob. Same IP the link was issued for -> no 403.
Trying to proxy the file through the server returns 403, because the server's
IP doesn't match the link. That's a property of the API, not a bug.

## Limits
- The file briefly sits in browser memory during download. Fine for Shorts;
  very large files could strain low-memory devices.
- RapidAPI free tiers have low request caps — watch your quota.

## Security
- RapidAPI key stays server-side in the function; browser never sees it.
- Rotate the key in the RapidAPI dashboard if it has ever been exposed.
