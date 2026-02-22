import { useState } from "react";
import { Copy, Check, Box, Layers, Wrench, Package } from "lucide-react";
import { DependencyItem } from "../hooks/useRegistryState";

interface DependencyGridProps {
  mcVersion: string | null;
  dependencies: DependencyItem[];
  loading?: boolean;
}

const LOADERS = new Set(["forge", "neoforge", "fabric-loader"]);
const BUILD_TOOLS = new Set(["forgegradle", "moddev-gradle", "loom", "neoform", "parchment"]);

const CATEGORY_ORDER = ["Loaders", "Build tools", "Mods"];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Loaders: <Layers className="w-4 h-4 text-zinc-500" />,
  "Build tools": <Wrench className="w-4 h-4 text-zinc-500" />,
  Mods: <Package className="w-4 h-4 text-zinc-500" />,
};

function getCategory(dep: DependencyItem): string {
  if (LOADERS.has(dep.name)) return "Loaders";
  if (BUILD_TOOLS.has(dep.name)) return "Build tools";
  return "Mods";
}

export function DependencyGrid({ mcVersion, dependencies, loading = false }: DependencyGridProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!mcVersion) return null;

  const grouped = dependencies.reduce(
    (acc, item) => {
      const category = getCategory(item);
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, DependencyItem[]>,
  );

  const renderSection = (title: string, deps: DependencyItem[]) => {
    if (!deps || deps.length === 0) return null;

    return (
      <div className="mb-10" key={title}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-200 border-b border-zinc-800 pb-2">
          {CATEGORY_ICONS[title] ?? <Box className="w-4 h-4 text-zinc-500" />}
          {title}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deps
            .filter((d) => !!d.version)
            .map((dep) => {
              const copyText = dep.coordinates ? dep.coordinates : dep.version;
              const loaderLabel = dep.loader !== "universal" ? dep.loader : null;

              let borderColor = "hover:border-zinc-600";
              if (dep.loader === "forge") borderColor = "hover:border-blue-500/50";
              if (dep.loader === "neoforge") borderColor = "hover:border-orange-500/50";
              if (dep.loader === "fabric") borderColor = "hover:border-yellow-500/50";

              return (
                <div
                  key={`${dep.loader}-${dep.name}`}
                  className={`glass-panel p-4 flex flex-col justify-between group transition-colors ${borderColor}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                        {dep.icon_url ? (
                          <img
                            src={dep.icon_url}
                            className="w-5 h-5 object-contain rounded-sm"
                            alt=""
                            loading="lazy"
                            width={20}
                            height={20}
                          />
                        ) : (
                          <Box className="w-4 h-4 text-zinc-600" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <span className="font-medium text-zinc-200 text-sm block">{dep.name}</span>
                        {loaderLabel && (
                          <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mt-0.5">
                            {loaderLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
                    <span className="font-mono text-[13px] text-zinc-400 truncate">
                      {dep.version}
                    </span>
                    <button
                      onClick={() => handleCopy(copyText, `${dep.loader}-${dep.name}`)}
                      title={dep.coordinates ? "Copy Maven coordinates" : "Copy version"}
                      className="p-1.5 -mr-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      {copiedKey === `${dep.loader}-${dep.name}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-16">
      {loading ? (
        <div className="py-12 text-sm text-zinc-500 font-mono animate-pulse">
          Loading metadata...
        </div>
      ) : dependencies.length > 0 ? (
        <div className="animate-in fade-in duration-300">
          {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) =>
            renderSection(cat, grouped[cat]),
          )}
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-sm text-zinc-400 mt-4 border border-zinc-800/50">
          No dependency data available for Minecraft {mcVersion}.
        </div>
      )}
    </div>
  );
}
