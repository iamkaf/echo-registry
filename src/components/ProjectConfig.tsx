import { useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';

interface ProjectConfigProps {
    projects: string[];
    onAdd: (project: string) => void;
    onRemove: (project: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
}

export function ProjectConfig({ projects, onAdd, onRemove, onMove }: ProjectConfigProps) {
    const [newProject, setNewProject] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAdd = () => {
        if (newProject.trim()) {
            onAdd(newProject.trim());
            setNewProject('');
        }
    };

    return (
        <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-zinc-200">Specific Projects</h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    {isExpanded ? 'Hide' : 'Show'} ({projects.length})
                </button>
            </div>

            {isExpanded && (
                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        {projects.map((project, index) => (
                            <div key={project} className="flex items-center gap-2">
                                <span className="flex-1 text-sm text-zinc-300 font-mono bg-zinc-800/50 px-2 py-1.5 rounded truncate border border-zinc-700/50">
                                    {project}
                                </span>
                                <div className="flex bg-zinc-800/50 rounded border border-zinc-700/50 overflow-hidden">
                                    <button
                                        onClick={() => onMove(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => onMove(index, 'down')}
                                        disabled={index === projects.length - 1}
                                        className="p-1.5 text-zinc-500 border-l border-zinc-700 hover:text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemove(project)}
                                    className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-zinc-800 rounded border border-transparent transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <div className="text-sm text-zinc-500 py-2 italic font-mono">
                                Fetching all available
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newProject}
                            onChange={(e) => setNewProject(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="Add modrinth slug (e.g. jade)"
                            className="flex-1 px-3 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newProject.trim()}
                            className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded border border-zinc-700 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
