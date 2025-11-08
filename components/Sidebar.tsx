import { MinecraftVersion, DependencyVersion } from '@/types/dependency';
import GradleSnippet from './GradleSnippet';
import ProjectConfig from './ProjectConfig';
import VersionSelect from './VersionSelect';

interface SidebarProps {
  versions: MinecraftVersion[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  onRefresh: () => void;
  loading: boolean;
  dependencies: DependencyVersion[];
}

export default function Sidebar({
  versions,
  selectedVersion,
  onVersionChange,
  onRefresh,
  loading,
  dependencies,
}: SidebarProps) {
  return (
    <div className="w-full lg:w-80 space-y-6 lg:shrink-0">
      {/* Version Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <VersionSelect
          versions={versions}
          selectedVersion={selectedVersion}
          onVersionChange={onVersionChange}
          disabled={loading}
        />

        <div className="mt-4">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  className="-ml-1 mr-2 h-4 w-4 text-gray-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {loading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
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
      {!loading && dependencies.length > 0 && <GradleSnippet dependencies={dependencies} mcVersion={selectedVersion} />}
    </div>
  );
}
