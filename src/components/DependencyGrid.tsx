import { useState } from "react";
import { Copy, Check, Box } from "lucide-react";
import { DependencyItem } from "../hooks/useRegistryState";

interface DependencyGridProps {
  mcVersion: string | null;
  dependencies: DependencyItem[];
  loading?: boolean;
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

  // Group dependencies by loader manually for nice sections
  const grouped = dependencies.reduce(
    (acc, item) => {
      const loader = item.loader.toLowerCase();
      const groupName = loader === "universal" ? "Common / Universal" : loader;
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(item);
      return acc;
    },
    {} as Record<string, DependencyItem[]>,
  );

  const renderSection = (title: string, deps: DependencyItem[]) => {
    if (!deps || deps.length === 0) return null;

    return (
      <div className="mb-10" key={title}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-200 border-b border-zinc-800 pb-2 capitalize">
          <Box className="w-4 h-4 text-zinc-500" />
          {title}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deps
            .filter((d) => !!d.version)
            .map((dep) => {
              const copyText = dep.coordinates ? dep.coordinates : dep.version;

              // Define subtle accent borders based on loader type
              let borderColor = "hover:border-zinc-600";
              if (dep.loader.toLowerCase() === "forge") borderColor = "hover:border-blue-500/50";
              if (dep.loader.toLowerCase() === "neoforge")
                borderColor = "hover:border-orange-500/50";
              if (dep.loader.toLowerCase() === "fabric") borderColor = "hover:border-yellow-500/50";

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
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mt-0.5">
                          {dep.loader}
                        </span>
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
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupName, groupItems]) => renderSection(groupName, groupItems))}
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-sm text-zinc-400 mt-4 border border-zinc-800/50">
          No dependency data available for Minecraft {mcVersion}.
        </div>
      )}
    </div>
  );
}
