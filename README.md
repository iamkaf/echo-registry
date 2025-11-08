# Echo Registry

Where dependency versions resonate - Latest Forge, NeoForge, Fabric, and popular mod versions for Minecraft.

## Overview

Echo Registry is a modern web service that provides the latest versions of Minecraft mod dependencies through a clean REST API and interactive web interface. Built with Next.js, Supabase, and deployed on Vercel.

## Features

- 🚀 **Real-time Version Tracking**: Latest versions for Forge, NeoForge, Fabric Loader, and popular mods
- 🎯 **Interactive UI**: Clean, responsive interface with version filtering
- 🔄 **Smart Caching**: 5-minute dependency cache, 1-hour Minecraft version cache
- 📡 **REST API**: Open API endpoints for programmatic access
- 🛡️ **Error Resilience**: Graceful handling of unavailable versions and network issues
- 📊 **Health Monitoring**: Built-in health checks and external API status

## Supported Dependencies

### Core Loaders

- **Minecraft Forge** - Recommended and latest versions
- **NeoForge** - Latest stable versions with compatibility checks
- **Fabric Loader** - Latest versions including beta/unstable

### Popular Mods & APIs

- **Fabric API** - Core Fabric API
- **Mod Menu** - Configuration menu mod
- **REI/Just Enough Items** - Item viewing mods
- **Architectury API** - Cross-loader compatibility
- **Amber** - Modding framework
- **Forge Config API Port** - Multiloader implementation of the Forge config system

### Development Tools

- **Parchment Mappings** - Java documentation mappings
- **NeoForm** - Minecraft deobfuscation
- **ForgeGradle** - Forge build system
- **ModDev Gradle** - NeoForge build system

## API Endpoints

### Health & Status

- `GET /api/health` - Health check and external API status

### Minecraft Versions

- `GET /api/versions/minecraft` - All available Minecraft versions

### Dependencies

- `GET /api/versions/dependencies/{mcVersion}` - All dependencies for Minecraft version
- `POST /api/versions/dependencies/{mcVersion}` - Bulk dependency fetching

### Example Usage

```bash
# Get all dependencies for Minecraft 1.21.1
curl https://echo-registry.vercel.app/api/versions/dependencies/1.21.1

# Get with custom projects
curl "https://echo-registry.vercel.app/api/versions/dependencies/1.21.1?projects=fabric-api,modmenu"

# Health check
curl https://echo-registry.vercel.app/api/health
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Setup

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/iamkaf/echo-registry
   cd echo-registry
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL from `supabase-schema.sql` in the Supabase SQL editor
   - Get your project URL and keys from Supabase settings

3. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

### Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional
CACHE_TTL_DEPENDENCIES=300000    # 5 minutes
CACHE_TTL_MINECRAFT=3600000      # 1 hour
HTTP_TIMEOUT=30000
USER_AGENT=EchoRegistry/1.0
```

## Deployment

### Vercel (Recommended)

1. **Connect to Vercel**

   ```bash
   npx vercel
   ```

2. **Configure environment variables in Vercel dashboard**
   - Add Supabase URL and keys
   - Set up any additional environment variables

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Automatic Cache Cleanup

The app includes automatic cache cleanup via Vercel cron jobs:

- Runs every 6 hours
- Removes expired cache entries
- Requires `CRON_SECRET` environment variable for security

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Serverless)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: native fetch API
- **XML Parsing**: fast-xml-parser

## License

This project is licensed under the MIT License.

---

**Echo Registry** - Where dependency versions resonate 🎵
