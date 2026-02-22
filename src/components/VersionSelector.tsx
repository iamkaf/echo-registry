import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface MinecraftVersion {
  id: string;
  version_type: string;
  release_time?: string;
}

interface VersionSelectorProps {
  versions: MinecraftVersion[];
  selectedVersion: string | null;
  onSelect: (version: string) => void;
  loading?: boolean;
}

export function VersionSelector({
  versions,
  selectedVersion,
  onSelect,
  loading = false,
}: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNonReleases, setShowNonReleases] = useState(false);

  const filteredVersions = useMemo(() => {
    let filtered = versions;

    if (searchTerm) {
      filtered = filtered.filter((v) => v.id.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (!showNonReleases) {
      filtered = filtered.filter((v) => v.version_type === "release");
    }

    return filtered;
  }, [versions, searchTerm, showNonReleases]);

  return (
    <div className="relative w-full z-30">
      <label
        htmlFor="version-selector"
        className="block mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider"
      >
        Target Environment
      </label>

      <button
        id="version-selector"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || versions.length === 0}
        className={cn(
          "w-full glass-panel px-4 py-2.5 flex items-center justify-between transition-colors",
          isOpen ? "border-zinc-500" : "hover:border-zinc-600",
          (loading || versions.length === 0) && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className="font-mono text-sm font-medium text-zinc-100">
          {loading
            ? "Loading..."
            : selectedVersion
              ? `Minecraft ${selectedVersion}`
              : "Select Version"}
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel max-h-[350px] flex flex-col shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
            <input
              type="text"
              placeholder="Search versions..."
              value={searchTerm}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono mb-2"
            />
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer w-fit uppercase font-medium tracking-wide">
              <input
                type="checkbox"
                checked={showNonReleases}
                onChange={(e) => setShowNonReleases(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              Show Snapshots & Pre-releases
            </label>
          </div>

          <div className="overflow-y-auto flex-1 p-1">
            {filteredVersions.length === 0 ? (
              <div className="p-3 text-sm text-zinc-500 text-center font-mono">
                No versions found
              </div>
            ) : (
              filteredVersions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    onSelect(v.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-mono transition-colors flex items-center justify-between rounded",
                    v.id === selectedVersion
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                  )}
                >
                  <span>{v.id}</span>
                  {v.version_type !== "release" && (
                    <span
                      className={cn(
                        "text-[10px] uppercase px-1.5 py-0.5 rounded ml-2",
                        v.id.includes("-pre") || v.id.includes("-rc")
                          ? "bg-amber-500/10 text-amber-500/70"
                          : "bg-blue-500/10 text-blue-500/70",
                      )}
                    >
                      {v.version_type}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
