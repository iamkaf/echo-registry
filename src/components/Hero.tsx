import { Database, Zap, Shield } from "lucide-react";

export function Hero() {
    return (
        <section className="py-12 md:py-20 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-text-main">
                Echo Registry
            </h1>

            <p className="text-lg text-text-muted mb-10 max-w-2xl leading-relaxed">
                Fast, reliable dependency versions for Minecraft modding. Access upstream Forge, NeoForge, and Fabric metadata cached globally at the edge.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel p-5">
                    <Zap className="w-5 h-5 text-emerald-500 mb-3" />
                    <h3 className="font-semibold text-sm mb-1 text-text-main">Edge Cached</h3>
                    <p className="text-xs text-text-muted">Sub-50ms latency powered by Cloudflare Workers KV.</p>
                </div>

                <div className="glass-panel p-5">
                    <Database className="w-5 h-5 text-blue-500 mb-3" />
                    <h3 className="font-semibold text-sm mb-1 text-text-main">Auto-Synced</h3>
                    <p className="text-xs text-text-muted">Always up-to-date with Maven and Modrinth registries.</p>
                </div>

                <div className="glass-panel p-5">
                    <Shield className="w-5 h-5 text-purple-500 mb-3" />
                    <h3 className="font-semibold text-sm mb-1 text-text-main">Reliable</h3>
                    <p className="text-xs text-text-muted">Designed for CI/CD and automated build scripts.</p>
                </div>
            </div>
        </section>
    );
}
