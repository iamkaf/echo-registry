import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ApiSnippetProps {
  mcVersion: string | null;
  projects: string[];
}

export function ApiSnippet({ mcVersion, projects }: ApiSnippetProps) {
  const [copied, setCopied] = useState(false);

  if (!mcVersion) return null;

  const generateUrl = () => {
    const query = projects.length > 0 ? `?projects=${projects.join(",")}` : "";
    return `https://echo.iamkaf.com/api/versions/dependencies/${mcVersion}${query}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-200">API Endpoint</h3>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Copy API URL"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="bg-zinc-950 p-3 rounded border border-zinc-800 overflow-x-auto text-[13px] leading-relaxed text-zinc-400 font-mono">
        <code>{`curl -s ${generateUrl()} | jq .`}</code>
      </pre>
    </div>
  );
}
