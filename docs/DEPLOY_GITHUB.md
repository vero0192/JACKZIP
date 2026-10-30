# Deploy JACKZIP to GitHub Pages

Repository: https://github.com/vero0192/JACKZIP

Site: https://vero0192.github.io/JACKZIP/

1. Keep application files at the repository root and preserve unrelated work when updating.
2. In Settings → Pages, set Source to **GitHub Actions**. This is a one-time repository setting; a successful upload alone does not enable hosting.
3. Push to `main` or run **Verify JACKZIP** manually on `main`. Pull requests and other branches run verification without deploying.
4. The workflow runs the eight Node suites, Chromium/browser/accessibility/offline checks, and `npm run build:pages`. It uploads verification reports and a dedicated `dist/` site artifact. Tests, dependencies, repository metadata, and documentation are excluded from that site artifact.
5. Only a successful verification job can reach the Pages deployment job. Inspect both jobs in Actions, then open the exact deployment URL.
6. Run `npm run test:live -- https://vero0192.github.io/JACKZIP/` to check real providers, leading zeros, downloads, the map, and the deployed offline shell. This network-dependent smoke check is separate from fixture-based CI.
7. Complete the physical-device and assistive-technology checks in `docs/RELEASE_CHECKLIST.md` before full production sign-off.

Local preview of the deployment artifact:

```bash
npm run build:pages
python3 -m http.server 8080 --directory dist
```

All application assets and module imports use relative paths. Manifest start_url/scope are `./`, and the worker registers as `./sw.js`.

When updating an installed app, reopen or reload after the new service worker activates. Raw source is not persisted; save your input before closing a tab. Cache cleanup is scoped to JACKZIP and retains unrelated caches.
