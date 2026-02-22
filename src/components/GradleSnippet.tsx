import { useState } from "react";
import { DependencyItem } from "../hooks/useRegistryState";
import { Copy, Check } from "lucide-react";

interface GradleSnippetProps {
  dependencies: DependencyItem[];
  mcVersion: string | null;
}

export function GradleSnippet({ dependencies, mcVersion }: GradleSnippetProps) {
  const [copied, setCopied] = useState(false);

  if (!dependencies.length) return null;

  const generateProperties = () => {
    let text = `minecraft_version=${mcVersion}\n`;

    // We try to organize known loaders/utilities at the top
    const orderedDeps = [...dependencies].sort((a, b) => {
      const getPriority = (d: DependencyItem) => {
        if (["forge", "neoforge", "fabric-loader"].includes(d.name)) return 1;
        if (["fabric-api"].includes(d.name)) return 2;
        return 3;
      };
      return getPriority(a) - getPriority(b);
    });

    for (const dep of orderedDeps) {
      let keyName = dep.name.replace(/-/g, "_") + "_version";
      if (dep.name === "fabric-loader") keyName = "fabric_loader_version";
      if (dep.name === "fabric-api") keyName = "fabric_api_version";
      text += `${keyName}=${dep.version}\n`;
    }

    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateProperties());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <pre className="bg-zinc-950 p-3 rounded border border-zinc-800 overflow-x-auto text-[13px] leading-relaxed text-zinc-400 font-mono">
        <code>{generateProperties()}</code>
      </pre>
    </div>
  );
}
