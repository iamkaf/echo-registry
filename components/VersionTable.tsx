import { DependencyVersion } from '@/types/dependency';

interface VersionTableProps {
  dependencies: DependencyVersion[];
}

export default function VersionTable({ dependencies }: VersionTableProps) {
  if (dependencies.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">No dependency data available</p>
      </div>
    );
  }

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dependency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loader</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dependencies.map((dependency) => (
              <tr key={`${dependency.name}-${dependency.mc_version}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{dependency.name}</div>
                  <div className="text-xs text-gray-500">MC {dependency.mc_version}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${getStatusColor(dependency.version)}`}>
                    {formatVersion(dependency.version)}
                  </div>
                  {dependency.fallback_used && <div className="text-xs text-yellow-600 mt-1">⚠️ Fallback used</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLoaderBadgeColor(dependency.loader)}`}
                  >
                    {dependency.loader}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{dependency.notes || '-'}</div>
                  {dependency.cached_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      Cached {new Date(dependency.cached_at).toLocaleTimeString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200">
        {dependencies.map((dependency) => (
          <div key={`${dependency.name}-${dependency.mc_version}`} className="p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{dependency.name}</h3>
                <p className="text-xs text-gray-500">MC {dependency.mc_version}</p>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLoaderBadgeColor(dependency.loader)}`}
              >
                {dependency.loader}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Version:</span>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getStatusColor(dependency.version)}`}>
                    {formatVersion(dependency.version)}
                  </div>
                  {dependency.fallback_used && <div className="text-xs text-yellow-600">⚠️ Fallback used</div>}
                </div>
              </div>

              {dependency.notes && (
                <div className="flex items-start justify-between">
                  <span className="text-xs text-gray-500">Notes:</span>
                  <div className="text-sm text-gray-900 text-right max-w-[60%]">{dependency.notes}</div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Source:</span>
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

              {dependency.cached_at && (
                <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                  Cached {new Date(dependency.cached_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
