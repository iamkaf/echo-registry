# Roadmap

## Backlog

### Infrastructure
- [ ] Migrate from Vercel to Cloudflare Pages
- [ ] Migrate from Supabase to Cloudflare D1/KV

### Reliability / API Consistency
- [ ] Fix `cleanupExpired()` contract mismatch: `app/api/dev/purge-cache` expects deleted count, service returns `void`
- [ ] Normalize `/api/projects/compatibility` loader keys for universal built-ins (`parchment`, `neoform`) to avoid dynamic `universal` key drift
- [ ] Preserve `loader_versions` and `coordinates` in dependency cache read/write path to prevent cached-vs-fresh response shape mismatch
- [ ] Align `DependenciesResponseSchema` with actual `/api/versions/dependencies/{mc}` payload (`{ mc_version, dependencies[] }`)
- [ ] Reduce health check false negatives by falling back to lightweight `GET` when third-party APIs reject/ignore `HEAD`

### Features
- [ ] Dark mode
- [ ] Copy-to-clipboard buttons for code snippets
- [ ] Add icons to dependency cards (Modrinth has `icon_url`, others need manual procurement)
- [ ] Add `include_changelog=false` to Modrinth API requests for lighter/faster responses
- [ ] Add more mod projects to the popular list

### Content
- [ ] Rewrite copy for clarity
- [ ] Improve error messages

---

## Completed (2025-01-19)

✅ **Snapshot Support**
- Validation accepts all MC formats (releases, snapshots, pre-releases, legacy)
- UI has color-coded badges and filtering toggle
- Tested with `26.1-snapshot-3`

✅ **Performance**
- Parallel promise execution in API routes
- O(1) Set lookups instead of O(n) array includes
- Memoized React components
- Extracted SVG icons to module scope
