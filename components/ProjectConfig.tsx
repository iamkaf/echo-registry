import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function ProjectConfig() {
  const [projects, setProjects] = useLocalStorage<string[]>('echo-registry-projects', [
    'amber',
    'fabric-api',
    'modmenu',
    'rei',
    'architectury-api',
  ]);
  const [newProject, setNewProject] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const addProject = () => {
    const trimmed = newProject.trim().toLowerCase();
    if (trimmed && !projects.includes(trimmed)) {
      setProjects([...projects, trimmed]);
      setNewProject('');
    }
  };

  const removeProject = (projectToRemove: string) => {
    setProjects(projects.filter((p) => p !== projectToRemove));
  };

  const moveProject = (index: number, direction: 'up' | 'down') => {
    const newProjects = [...projects];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < projects.length) {
      [newProjects[index], newProjects[newIndex]] = [newProjects[newIndex], newProjects[index]];
      setProjects(newProjects);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Projects</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? 'Hide' : 'Show'} ({projects.length})
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Current projects */}
          <div className="space-y-2">
            {projects.map((project, index) => (
              <div key={project} className="flex items-center gap-1 lg:gap-2">
                <div className="flex-1 flex items-center gap-1 lg:gap-2 min-w-0">
                  <span className="text-xs lg:text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded truncate">
                    {project}
                  </span>
                  {index > 0 && (
                    <button
                      onClick={() => moveProject(index, 'up')}
                      className="text-gray-400 hover:text-gray-600 p-1 text-xs lg:text-sm flex-shrink-0"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < projects.length - 1 && (
                    <button
                      onClick={() => moveProject(index, 'down')}
                      className="text-gray-400 hover:text-gray-600 p-1 text-xs lg:text-sm flex-shrink-0"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeProject(project)}
                  className="text-red-500 hover:text-red-700 text-xs lg:text-xs flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Add new project */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addProject()}
              placeholder="Add project (e.g., jade)"
              className="flex-1 px-2 lg:px-3 py-1 lg:py-1 text-xs lg:text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={addProject}
              disabled={!newProject.trim()}
              className="px-2 lg:px-3 py-1 lg:py-1 text-xs lg:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              Add
            </button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Projects are fetched from Modrinth</p>
            <p>• Order determines priority in results</p>
            <p>• First project appears first in list</p>
          </div>
        </div>
      )}
    </div>
  );
}
