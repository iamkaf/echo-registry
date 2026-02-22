import { useState, useEffect } from "react";
import { Copy, Check, Box } from "lucide-react";

interface DependencyItem {
    name: string;
    loader: string;
    version: string;
    mc_version: string;
    source_url?: string;
    coordinates?: string;
}

interface DependencyData {
    dependencies: DependencyItem[];
    mc_version: string;
}

interface DependencyGridProps {
    mcVersion: string | null;
}

export function DependencyGrid({ mcVersion }: DependencyGridProps) {
    const [items, setItems] = useState<DependencyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        if (!mcVersion) return;

        setLoading(true);
        fetch(`/api/versions/dependencies/${mcVersion}`)
            .then((res) => res.json() as Promise<{ data: DependencyData }>)
            .then((json) => {
                setItems(json.data?.dependencies || []);
            })
            .catch((err) => console.error("Failed to load dependencies", err))
            .finally(() => setLoading(false));
    }, [mcVersion]);

    const handleCopy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (!mcVersion) return null;

    // Group dependencies by loader manually for nice sections
    const grouped = items.reduce((acc, item) => {
        const loader = item.loader.toLowerCase();
        const groupName = loader === "universal" ? "Common / Universal" : loader;
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(item);
        return acc;
    }, {} as Record<string, DependencyItem[]>);

    const renderSection = (title: string, deps: DependencyItem[]) => {
        if (!deps || deps.length === 0) return null;

        return (
            <div className="mb-10" key={title}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-text-main border-b border-border pb-2 capitalize">
                    <Box className="w-4 h-4 text-text-muted" />
                    {title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {deps.filter(d => !!d.version).map((dep) => {
                        const copyText = dep.coordinates ? dep.coordinates : dep.version;
                        return (
                            <div
                                key={`${dep.loader}-${dep.name}`}
                                className="glass-panel p-4 flex flex-col justify-between group transition-colors hover:border-zinc-600"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-medium text-text-main text-sm">
                                        {dep.name}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono text-xs text-text-muted truncate">
                                        {dep.version}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(copyText, `${dep.loader}-${dep.name}`)}
                                        title={dep.coordinates ? "Copy Maven coordinates" : "Copy version"}
                                        className="p-1.5 -mr-1.5 rounded text-zinc-500 hover:text-text-main hover:bg-zinc-800 transition-colors"
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
                <div className="py-12 text-sm text-text-muted font-mono animate-pulse">
                    Loading metadata...
                </div>
            ) : items.length > 0 ? (
                <div className="animate-in fade-in duration-300">
                    {Object.entries(grouped)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([groupName, groupItems]) => renderSection(groupName, groupItems))}
                </div>
            ) : (
                <div className="text-sm text-text-muted py-8 font-mono">
                    No dependency data available for Minecraft {mcVersion}.
                </div>
            )}
        </div>
    );
}
