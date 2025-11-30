import { DependencyVersion } from '@/types/dependency';
import VersionTableSkeleton from './VersionTableSkeleton';

interface VersionTableProps {
  dependencies: DependencyVersion[];
  isLoading?: boolean;
}

// Helper function to categorize dependencies and get border colors
const getDependencyBorderColor = (dependencyName: string): string => {
  const buildTools = [
    'forge',
    'neoforge',
    'fabric-loader'
  ];

  const devTools = [
    'parchment',
    'neoform',
    'moddev-gradle',
    'forgegradle',
    'loom'
  ];

  const mods = [
    'amber',
    'fabric-api',
    'modmenu',
    'rei',
    'architectury-api',
    'forge-config-api-port'
  ];

  const normalizedName = dependencyName.toLowerCase();

  if (buildTools.includes(normalizedName)) {
    return 'border-2 border-blue-400 hover:border-blue-500';
  } else if (devTools.includes(normalizedName)) {
    return 'border-2 border-purple-400 hover:border-purple-500';
  } else if (mods.includes(normalizedName)) {
    return 'border-2 border-green-400 hover:border-green-500';
  } else {
    return 'border-2 border-gray-300 hover:border-gray-400';
  }
};

// Helper component for loader badge
const LoaderBadge = ({ loader }: { loader: DependencyVersion['loader'] }) => {
  const getLoaderBadgeColor = (loader: DependencyVersion['loader']) => {
    switch (loader) {
      case 'forge':
        return 'bg-blue-100 text-blue-800';
      case 'neoforge':
        return 'bg-orange-100 text-orange-800';
      case 'fabric':
        return 'bg-yellow-100 text-yellow-800';
      case 'universal':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLoaderBadgeColor(loader)}`}
    >
      {loader}
    </span>
  );
};

// Helper component for version display
const VersionDisplay = ({ version, fallback_used }: { version: string | null, fallback_used?: boolean }) => {
  const getStatusColor = (version: string | null) => {
    if (version === null) return 'text-red-600 font-medium';
    if (version === 'N/A') return 'text-gray-400 font-medium';
    return 'text-gray-900';
  };

  const formatVersion = (version: string | null) => {
    if (version === null) return 'Error';
    if (version === 'N/A') return 'N/A';
    return version;
  };

  return (
    <div className="text-right">
      <div className={`text-sm font-medium ${getStatusColor(version)}`}>
        {formatVersion(version)}
      </div>
      {fallback_used && (
        <div className="text-xs text-yellow-600">⚠️ Fallback used</div>
      )}
    </div>
  );
};

// Helper component for individual dependency card
const DependencyCard = ({ dependency }: { dependency: DependencyVersion }) => {
  const borderColorClass = getDependencyBorderColor(dependency.name);

  return (
    <div className={`bg-white border ${borderColorClass} rounded-lg p-4 hover:shadow-sm transition-all duration-200 h-64 flex flex-col`}>
      <div className="space-y-3 flex-1 flex flex-col">
        {/* Header: Name + Loader Badge */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate" title={dependency.name}>
              {dependency.name}
            </h3>
            <p className="text-sm text-gray-500">MC {dependency.mc_version}</p>
          </div>
          <LoaderBadge loader={dependency.loader} />
        </div>

        {/* Version Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Version:</span>
          <VersionDisplay
            version={dependency.version}
            fallback_used={dependency.fallback_used}
          />
        </div>

        {/* Notes (conditional) */}
        {dependency.notes && (
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Notes:</span>
            <div className="text-sm text-gray-900">{dependency.notes}</div>
          </div>
        )}

        {/* Source Link (conditional) */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Source:</span>
          {dependency.source_url ? (
            <a
              href={dependency.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              View Source
            </a>
          ) : (
            <span className="text-gray-400 text-sm">No source</span>
          )}
        </div>

        {/* Cache Timestamp (conditional) */}
        {dependency.cached_at && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 mt-auto">
            Cached {new Date(dependency.cached_at).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default function VersionTable({ dependencies, isLoading = false }: VersionTableProps) {
  // Show skeleton when loading
  if (isLoading) {
    return <VersionTableSkeleton />;
  }

  if (dependencies.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">No dependency data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-min">
        {dependencies.map((dependency) => (
          <DependencyCard
            key={`${dependency.name}-${dependency.mc_version}`}
            dependency={dependency}
          />
        ))}
      </div>
    </div>
  );
}
