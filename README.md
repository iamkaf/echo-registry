# Echo Registry

Echo Registry provides the latest versions of Forge, NeoForge, Fabric, and popular Minecraft mods through a simple REST API and web interface.

---

## Overview

The service exposes up-to-date version data for core mod loaders, popular mods, and development tools.
It’s designed for mod developers and automated build systems that need current dependency versions.

---

## Supported Dependencies

**Loaders** – Forge, NeoForge, Fabric Loader
**Mods/APIs** – Fabric API, Mod Menu, REI, JEI, Architectury API, Amber, Forge Config API Port
**Dev Tools** – Parchment Mappings, NeoForm, ForgeGradle, ModDev Gradle

---

## API

### Endpoints

* `GET /api/health` – Service health
* `GET /api/versions/minecraft` – All supported Minecraft versions
* `GET /api/versions/dependencies/{mcVersion}` – Dependencies for a given Minecraft version
* `POST /api/versions/dependencies/{mcVersion}` – Bulk dependency lookup

### Examples

```bash
curl https://echo-registry.vercel.app/api/versions/dependencies/1.21.1
curl "https://echo-registry.vercel.app/api/versions/dependencies/1.21.1?projects=fabric-api,modmenu"
```

---

## Development

### Requirements

* Node.js 22+
* npm
* Supabase account

### Setup

```bash
git clone https://github.com/iamkaf/echo-registry
cd echo-registry
npm install
```

1. Create a Supabase project and run `supabase-schema.sql`.
2. Copy `.env.local.example` to `.env.local` and fill in your credentials.
3. Start the dev server:

   ```bash
   npm run dev
   ```
4. Visit [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CACHE_TTL_DEPENDENCIES=300000
CACHE_TTL_MINECRAFT=3600000
HTTP_TIMEOUT=30000
USER_AGENT=EchoRegistry/1.0
```

---

## Deployment

Deploy to Vercel:

```bash
npx vercel
npx vercel --prod
```

Add your Supabase credentials in the Vercel dashboard.
A cron job removes expired cache entries every six hours (`CRON_SECRET` required).

---

## License

MIT License
