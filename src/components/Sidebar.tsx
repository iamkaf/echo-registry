import { VersionSelector } from './VersionSelector';
import { ProjectConfig } from './ProjectConfig';
import { GradleSnippet } from './GradleSnippet';
import { ApiSnippet } from './ApiSnippet';
import { RefreshCw } from 'lucide-react';
import { MinecraftVersion, DependencyItem } from '../hooks/useRegistryState';

interface SidebarProps {
    versions: MinecraftVersion[];
    selectedVersion: string | null;
    onVersionChange: (version: string) => void;
    onRefresh: () => void;
    loading: boolean;
    dependencies: DependencyItem[];
    projects: string[];
    addProject: (p: string) => void;
    removeProject: (p: string) => void;
    moveProject: (i: number, d: 'up' | 'down') => void;
}

export function Sidebar({
    versions,
    selectedVersion,
    onVersionChange,
    onRefresh,
    loading,
    dependencies,
    projects,
    addProject,
    removeProject,
    moveProject
}: SidebarProps) {
    return (
        <div className="w-full lg:w-80 space-y-6 lg:shrink-0">
            {/* Version Selection */}
            <div className="glass-panel p-6">
                <VersionSelector
                    versions={versions}
                    selectedVersion={selectedVersion}
                    onSelect={onVersionChange}
                    loading={loading}
                />

                <div className="mt-4">
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            {/* Project Configuration */}
            <ProjectConfig
                projects={projects}
                onAdd={addProject}
                onRemove={removeProject}
                onMove={moveProject}
            />

            {/* Gradle Properties Snippet */}
            {!loading && dependencies.length > 0 && (
                <GradleSnippet dependencies={dependencies} mcVersion={selectedVersion} />
            )}

            {/* API Request Snippet */}
            {!loading && dependencies.length > 0 && (
                <ApiSnippet mcVersion={selectedVersion} projects={projects} />
            )}
        </div>
    );
}
