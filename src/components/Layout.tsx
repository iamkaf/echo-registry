import { ReactNode } from "react";
import { Server, Activity, ArrowRight } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative selection:bg-zinc-800 selection:text-white flex flex-col">
      <nav className="border-b border-border bg-panel/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-canvas flex items-center justify-center border border-border">
              <Server className="w-3.5 h-3.5 text-text-main" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">Echo Registry</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://echo.iamkaf.com/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-text-muted hover:text-white transition-colors"
            >
              OpenAPI
            </a>
            <a
              href="https://github.com/iamkaf/echo-registry"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-text-muted hover:text-white transition-colors flex items-center gap-1.5 group"
            >
              GitHub
              <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-white transition-colors" />
            </a>
            <div className="px-2.5 py-1 rounded bg-canvas border border-border flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] text-zinc-400">v0.8.0</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">{children}</main>

      <footer className="border-t border-border mt-auto py-6 bg-canvas">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted">
          <p>Echo Registry. Powered by Cloudflare Workers KV.</p>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <span className="font-mono">{__GIT_COMMIT__}</span>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              <span>Systems Normal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
