import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface VersionSelectorProps {
    versions: string[];
    selectedVersion: string | null;
    onSelect: (version: string) => void;
    loading?: boolean;
}

export function VersionSelector({ versions, selectedVersion, onSelect, loading = false }: VersionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-full z-30">
            <label className="block mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Target Environment
            </label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading || versions.length === 0}
                className={cn(
                    "w-full glass-panel px-4 py-2.5 flex items-center justify-between transition-colors",
                    isOpen ? "border-zinc-500" : "hover:border-zinc-600",
                    (loading || versions.length === 0) && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className="font-mono text-sm font-medium text-zinc-100">
                    {loading ? "Loading..." : selectedVersion ? `Minecraft ${selectedVersion}` : "Select Version"}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && !loading && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-panel max-h-[300px] overflow-y-auto shadow-xl z-50">
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
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
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
