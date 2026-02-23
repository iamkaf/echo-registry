import { useState } from "react";
import { Copy, Check, Box, Layers, Wrench, Package, AlertCircle } from "lucide-react";
import { DependencyItem } from "../hooks/useRegistryState";

interface DependencyGridProps {
  mcVersion: string | null;
  dependencies: DependencyItem[];
  projectCount?: number;
}

const LOADERS = new Set(["forge", "neoforge", "fabric-loader"]);
const BUILD_TOOLS = new Set(["forgegradle", "moddev-gradle", "loom", "neoform", "parchment"]);

const CATEGORY_ORDER = ["Loaders", "Build tools", "Mods"];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Loaders: <Layers className="w-4 h-4 text-zinc-500" />,
  "Build tools": <Wrench className="w-4 h-4 text-zinc-500" />,
  Mods: <Package className="w-4 h-4 text-zinc-500" />,
};

// Static metadata for items whose identity is always known — only their version is dynamic
const STATIC_LOADERS = [
  { name: "forge", loader: "forge", icon: "/icons/forge.png" },
  { name: "neoforge", loader: "neoforge", icon: "/icons/neoforge.png" },
  { name: "fabric-loader", loader: "fabric", icon: "/icons/fabric.png" },
] as const;

const STATIC_BUILD_TOOLS = [
  { name: "forgegradle", loader: "forge", icon: "/icons/forge.png" },
  { name: "moddev-gradle", loader: "neoforge", icon: "/icons/neoforge.png" },
  { name: "loom", loader: "fabric", icon: "/icons/fabric.png" },
  { name: "neoform", loader: "neoforge", icon: "/icons/neoforge.png" },
  { name: "parchment", loader: "universal", icon: "/icons/parchment.png" },
] as const;

function getCategory(dep: DependencyItem): string {
  if (LOADERS.has(dep.name)) return "Loaders";
  if (BUILD_TOOLS.has(dep.name)) return "Build tools";
  return "Mods";
}

// Card with real name/icon but skeleton version row — used for Loaders and Build Tools while loading
function StaticSkeletonCard({
  name,
  loader,
  icon,
}: {
  name: string;
  loader: string;
  icon: string;
}) {
  const loaderLabel = loader !== "universal" ? loader : null;
  return (
    <div className="glass-panel p-4 flex flex-col justify-between">
      <div className="flex items-start gap-2 mb-4">
        <span className="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center">
          <img
            src={icon}
            className="w-5 h-5 object-contain rounded-sm"
            alt=""
            width={20}
            height={20}
          />
        </span>
        <div className="min-w-0">
          <span className="font-medium text-zinc-200 text-sm block">{name}</span>
          {loaderLabel && (
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mt-0.5">
              {loaderLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 bg-zinc-900/50 p-2 rounded border border-zinc-800/50 animate-pulse">
        <div className="h-3.5 w-28 bg-zinc-800 rounded" />
        <div className="h-6 w-6 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

// Full skeleton card — used for Mods whose identity is unknown until data arrives
function SkeletonCard() {
  return (
    <div className="glass-panel p-4 flex flex-col justify-between animate-pulse">
      <div className="flex items-start gap-2 mb-4">
        <div className="w-5 h-5 bg-zinc-800 rounded-sm shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-20 bg-zinc-800 rounded" />
          <div className="h-2.5 w-12 bg-zinc-800/60 rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
        <div className="h-3.5 w-28 bg-zinc-800 rounded" />
        <div className="h-6 w-6 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

export function DependencyGrid({
  mcVersion,
  dependencies,
  projectCount = 4,
}: DependencyGridProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!mcVersion) return null;

  if (dependencies.length === 0) {
    return (
      <div className="w-full pb-16">
        {/* Loaders: real cards, version skeleton */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-200 border-b border-zinc-800 pb-2">
            {CATEGORY_ICONS["Loaders"]}
            Loaders
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STATIC_LOADERS.map((item) => (
              <StaticSkeletonCard key={item.name} {...item} />
            ))}
          </div>
        </div>

        {/* Build tools: real cards, version skeleton */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-200 border-b border-zinc-800 pb-2">
            {CATEGORY_ICONS["Build tools"]}
            Build tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STATIC_BUILD_TOOLS.map((item) => (
              <StaticSkeletonCard key={item.name} {...item} />
            ))}
          </div>
        </div>

        {/* Mods: full skeleton cards */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-200 border-b border-zinc-800 pb-2">
            {CATEGORY_ICONS["Mods"]}
            Mods
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: projectCount }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const grouped = dependencies.reduce(
    (acc, item) => {
      const category = getCategory(item);
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, DependencyItem[]>,
  );

  const renderCard = (dep: DependencyItem) => {
    const isUnavailable = !dep.version || dep.version === "N/A";
    const copyText = dep.coordinates ? dep.coordinates : dep.version;
    const loaderLabel = dep.loader !== "universal" ? dep.loader : null;
    const cardKey = `${dep.loader}-${dep.name}`;

    let borderColor = "hover:border-zinc-600";
    if (dep.loader === "forge") borderColor = "hover:border-blue-500/50";
    if (dep.loader === "neoforge") borderColor = "hover:border-orange-500/50";
    if (dep.loader === "fabric") borderColor = "hover:border-yellow-500/50";

    return (
      <div
        key={cardKey}
        className={`glass-panel p-4 flex flex-col justify-between group transition-colors ${isUnavailable ? "opacity-50" : borderColor}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-2 min-w-0">
            <span className="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center">
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

        {isUnavailable ? (
          <div className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="font-mono text-[13px] text-zinc-600 truncate">
              {dep.version === "N/A" ? "Not available" : "Unavailable"}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
            <span className="font-mono text-[13px] text-zinc-400 truncate">{dep.version}</span>
            <button
              onClick={() => handleCopy(copyText!, cardKey)}
              title={dep.coordinates ? "Copy Maven coordinates" : "Copy version"}
              className="p-1.5 -mr-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              {copiedKey === cardKey ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, deps: DependencyItem[]) => {
    if (!deps || deps.length === 0) return null;

    const isFixed = title === "Loaders" || title === "Build tools";
    const visibleDeps = isFixed ? deps : deps.filter((d) => !!d.version && d.version !== "N/A");

    if (visibleDeps.length === 0) return null;

    return (
      <div className="mb-10" key={title}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-200 border-b border-zinc-800 pb-2">
          {CATEGORY_ICONS[title] ?? <Box className="w-4 h-4 text-zinc-500" />}
          {title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleDeps.map(renderCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-16">
      {dependencies.length > 0 ? (
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
