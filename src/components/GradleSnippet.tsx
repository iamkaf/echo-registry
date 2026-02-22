import { useState } from "react";
import { DependencyItem } from "../hooks/useRegistryState";
import { Copy, Check } from "lucide-react";

interface GradleSnippetProps {
  dependencies: DependencyItem[];
  mcVersion: string | null;
  loading?: boolean;
}

interface PropertyLine {
  key: string;
  value: string;
  icon: string | null;
}

const SKELETON_WIDTHS = [72, 60, 78, 55, 68, 63, 50, 70];

export function GradleSnippet({ dependencies, mcVersion, loading = false }: GradleSnippetProps) {
  const [copied, setCopied] = useState(false);

  const showSkeleton = loading && dependencies.length === 0;

  if (!showSkeleton && !dependencies.length) return null;
  if (!mcVersion && !showSkeleton) return null;

  const orderedDeps = [...dependencies].sort((a, b) => {
    const getPriority = (d: DependencyItem) => {
      if (["forge", "neoforge", "fabric-loader"].includes(d.name)) return 1;
      if (["fabric-api"].includes(d.name)) return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });

  const propertyLines: PropertyLine[] = mcVersion
    ? [
        { key: "minecraft_version", value: mcVersion, icon: "/icons/minecraft.svg" },
        ...orderedDeps.map((dep) => {
          let keyName = dep.name.replace(/-/g, "_") + "_version";
          if (dep.name === "fabric-loader") keyName = "fabric_loader_version";
          if (dep.name === "fabric-api") keyName = "fabric_api_version";
          return { key: keyName, value: dep.version, icon: dep.icon_url ?? null };
        }),
      ]
    : [];

  const generatePropertiesText = () =>
    propertyLines.map((l) => `${l.key}=${l.value}`).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePropertiesText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showSkeleton) {
    return (
      <div className="glass-panel p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-6 w-6 bg-zinc-800 rounded" />
        </div>
        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2.5">
          {SKELETON_WIDTHS.map((w, i) => (
            <div key={i} className="h-3.5 bg-zinc-800/70 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-200">gradle.properties</h3>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="bg-zinc-950 p-3 rounded border border-zinc-800 overflow-x-auto text-[13px] leading-relaxed font-mono">
        {propertyLines.map((line, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center select-none" aria-hidden="true">
              {line.icon ? (
                <img
                  src={line.icon}
                  className="w-3.5 h-3.5 object-contain"
                  alt=""
                  loading="lazy"
                  width={14}
                  height={14}
                />
              ) : null}
            </span>
            <span className="whitespace-nowrap">
              <span className="text-sky-400">{line.key}</span>
              <span className="text-zinc-600">=</span>
              <span className="text-emerald-400">{line.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
