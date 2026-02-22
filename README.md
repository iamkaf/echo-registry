# Echo Registry

Echo Registry provides the latest versions of Forge, NeoForge, Fabric, and popular Minecraft mods through a simple REST API and web interface.

Built to be blazing fast, it runs entirely on **Cloudflare Workers** with **Workers KV** for caching, powered by **Hono** on the backend and **React + Vite** on the frontend.

## Overview

The service exposes up-to-date version data for core mod loaders, popular mods, and development tools.
It’s designed for mod developers and automated build systems that need current dependency versions.

## Supported Dependencies

**Loaders** – Forge, NeoForge, Fabric Loader
**Mods/APIs** – Fabric API, Mod Menu, REI, JEI, Architectury API, Amber, Forge Config API Port
**Dev Tools** – Parchment Mappings, NeoForm, ForgeGradle, ModDev Gradle

## API Endpoints

- `GET /api/health` – Service health and cache connectivity status
- `GET /api/versions/minecraft` – All supported Minecraft versions
- `GET /api/versions/dependencies/{mcVersion}` – Built-in dependencies for a given Minecraft version
- `GET /api/projects/compatibility` – Bulk compatibility checking for custom Modrinth projects

### Examples

```bash
# Get all dependencies for Minecraft 1.21.4
curl https://echo.iamkaf.com/api/versions/dependencies/1.21.4

# Check compatibility with multiple projects
curl "https://echo.iamkaf.com/api/projects/compatibility?projects=fabric-api,modmenu&versions=1.21.4"
```

## Development

### Tech Stack
- **Backend:** Cloudflare Workers, Hono
- **Frontend:** React, Vite, Tailwind v4
- **Database:** Workers KV
- **Tooling:** TypeScript (`tsgo`), Oxlint, Oxfmt

### Requirements

- Node.js 22+
- npm
- Cloudflare account with Workers access

### Setup

```bash
git clone https://github.com/iamkaf/echo-registry
cd echo-registry
npm install
```

1. Create a Workers KV namespace:
   ```bash
   npx wrangler kv namespace create CACHE
   ```
2. Update `wrangler.jsonc` and replace the `id` under `kv_namespaces` with your new namespace ID.
3. Start the Vite development server (which emulates the Worker locally):
   ```bash
   npm run dev
   ```
4. Visit [http://localhost:5173](http://localhost:5173) (or whatever port Vite assigns).

### Tooling Commands

- `npm run dev`: Start the local dev server
- `npm run build`: Build the SSR bundle and client SPA
- `npm run typecheck`: Run TSGO type checking
- `npm run lint`: Run Oxlint
- `npm run format`: Format code with Oxfmt

## Configuration

Configuration is managed in `wrangler.jsonc`. Variables available:

- `CACHE_TTL_DEPENDENCIES`: Time (in seconds) to cache dependency queries (default: `300`).
- `CACHE_TTL_MINECRAFT`: Time (in seconds) to cache the Minecraft manifest (default: `3600`).

## Deployment

Deploy directly to Cloudflare Workers:

```bash
npm run deploy
```

## License

MIT License
