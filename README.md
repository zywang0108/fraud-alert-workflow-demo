# Fraud Alert Agent Workflow Demo

Static site for a bank fraud alert audit workflow. The page walks through the current manual audit flow, ML alert generation, Evidence Agents, report generation, SFT/RLVR/RLHF feedback, evaluation, MLOps, and model runtime options.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Files

- `index.html`: lightweight application shell and global navigation.
- `workflow.js`: step metadata and fragment paths.
- `pages/`: one independently loaded HTML fragment per workflow step.
- `app.js`: navigation, URL state, lazy loading, and fragment cache.
- `styles.css`: shared visual system and responsive layout.

Each workflow step has a shareable hash URL such as `#step-03`. The browser
loads the active step first and prefetches only the next step.

## Production build

```bash
pnpm run build
```

The production bundle is written to `dist/` for Cloudflare Worker-compatible
hosting.
