import { MinecraftVersion, DependencyVersion } from '@/types/dependency';
import { SpinnerIcon, RefreshIcon } from './icons';
import GradleSnippet from './GradleSnippet';
import ApiSnippet from './ApiSnippet';
import ProjectConfig from './ProjectConfig';
import VersionSelect from './VersionSelect';

interface SidebarProps {
  versions: MinecraftVersion[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  onRefresh: () => void;
  loading: boolean;
  isAnyRequestLoading: boolean;
  loadingContext: string | null;
  dependencies: DependencyVersion[];
  projects: string[];
}

export default function Sidebar({
  versions,
  selectedVersion,
  onVersionChange,
  onRefresh,
  loading,
  isAnyRequestLoading,
  loadingContext,
  dependencies,
  projects,
}: SidebarProps) {
  return (
    <div className="w-full lg:w-80 space-y-6 lg:shrink-0">
      {/* Version Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <VersionSelect
          versions={versions}
          selectedVersion={selectedVersion}
          onVersionChange={onVersionChange}
          disabled={isAnyRequestLoading || loading}
        />

        <div className="mt-4">
          <button
            onClick={onRefresh}
            disabled={isAnyRequestLoading || loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnyRequestLoading ? (
              <>
                <SpinnerIcon className="-ml-1 mr-2 h-4 w-4 text-gray-700" />
                {loadingContext || 'Loading...'}
              </>
            ) : (
              <>
                <RefreshIcon className="-ml-1 mr-2 h-4 w-4 text-gray-700" />
                Refresh
              </>
            )}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {loading ? (
            <span className="flex items-center">
              <SpinnerIcon className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
              Loading dependencies...
            </span>
          ) : (
            <span>Showing {selectedVersion} dependencies</span>
          )}
        </div>
      </div>

      {/* Project Configuration */}
      <ProjectConfig />

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
