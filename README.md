# Deepfake Detection

Conversion-focused SaaS site for the Deepfake Detection API at `deepfakedetection.site`.

## What is included

- React/Vite frontend with upload-style API sandbox
- Useful keyword resource pages for Deepfake Detection research and buyer intent
- Cloudflare Worker with `/api/scan`, `/api/checkout`, `/api/analytics`, `/sitemap.xml`, and `/robots.txt`
- Cloudflare Pages Functions that reuse the same Worker handlers
- Creem hosted checkout through `API_PROD_KEY`
- KV-friendly first-party analytics events

## Commands

```bash
npm run dev
npm run build
npm test
npm run cloudflare:deploy
npm run pages:deploy
```

## Related Project

- [OpenHuman Online](https://openhuman.online/?utm_source=github&utm_medium=readme&utm_campaign=openhuman_public_repos&utm_content=my_deepfakedetection) helps teams turn source material, notes, and meetings into an inspectable AI memory tree for human-reviewed workflows.
