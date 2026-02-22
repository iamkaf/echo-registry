import { useState, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface VersionSelectorProps {
    selectedVersion: string | null;
    onSelect: (version: string) => void;
}

export function VersionSelector({ selectedVersion, onSelect }: VersionSelectorProps) {
    const [versions, setVersions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/versions/minecraft")
            .then((res) => res.json() as Promise<{ data: { versions: { id: string }[] } }>)
            .then((json) => {
                const fetchedVersions = json.data?.versions?.map(v => v.id) || [];
                setVersions(fetchedVersions);
                if (fetchedVersions.length > 0 && !selectedVersion) {
                    onSelect(fetchedVersions[0]);
                }
            })
            .catch((err) => console.error("Failed to load versions", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="relative w-full max-w-[280px] mb-8 z-30">
            <label className="block mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                Target Environment
            </label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className={cn(
                    "w-full glass-panel px-4 py-2.5 flex items-center justify-between transition-colors",
                    isOpen ? "border-zinc-500" : "hover:border-zinc-600",
                    loading && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className="font-mono text-sm font-medium text-text-main">
                    {loading ? "Loading..." : selectedVersion ? `Minecraft ${selectedVersion}` : "Select Version"}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && !loading && (
                <div className="absolute top-full left-0 right-0 mt-1 glass-panel max-h-[300px] overflow-y-auto shadow-lg">
                    {versions.map((v) => (
                        <button
                            key={v}
                            onClick={() => {
                                onSelect(v);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-4 py-2 text-sm font-mono transition-colors flex items-center justify-between",
                                v === selectedVersion
                                    ? "bg-zinc-800 text-white"
                                    : "text-text-muted hover:bg-zinc-800/50 hover:text-text-main"
                            )}
                        >
                            <span>{v}</span>
                            {v === selectedVersion && (
                                <Check className="w-3.5 h-3.5 text-zinc-300" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
