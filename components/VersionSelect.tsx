import { useState, useMemo } from 'react';
import { MinecraftVersion } from '@/types/dependency';

interface VersionSelectProps {
  versions: MinecraftVersion[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  disabled?: boolean;
}

export default function VersionSelect({
  versions,
  selectedVersion,
  onVersionChange,
  disabled = false,
}: VersionSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNonReleases, setShowNonReleases] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Get version type and styling
  const getVersionInfo = (version: MinecraftVersion) => {
    const id = version.id.toLowerCase();

    if (id.includes('-pre')) {
      return {
        type: 'pre-release',
        label: 'Pre-Release',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
      };
    }
    if (id.includes('-rc')) {
      return {
        type: 'release-candidate',
        label: 'RC',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      };
    }
    if (version.version_type === 'snapshot') {
      return {
        type: 'snapshot',
        label: 'Snapshot',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      };
    }
    return {
      type: 'release',
      label: 'Release',
      color: 'text-green-600',
      bg: 'bg-green-50',
    };
  };

  // Filter and sort versions
  const filteredVersions = useMemo(() => {
    let filtered = versions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((v) => v.id.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter non-releases if checkbox is unchecked
    if (!showNonReleases) {
      filtered = filtered.filter((v) => v.version_type === 'release');
    }

    // Find latest release and latest snapshot
    const latestRelease = filtered
      .filter((v) => v.version_type === 'release')
      .sort((a, b) => new Date(b.release_time).getTime() - new Date(a.release_time).getTime())[0];

    const latestSnapshot = filtered
      .filter((v) => v.version_type === 'snapshot')
      .sort((a, b) => new Date(b.release_time).getTime() - new Date(a.release_time).getTime())[0];

    // Filter out the latest versions from the main list
    const otherVersions = filtered.filter(
      (v) => v.id !== latestRelease?.id && v.id !== latestSnapshot?.id,
    );

    // Sort other versions: releases first, then by release time (newest first)
    const sortedOthers = otherVersions.sort((a, b) => {
      if (a.version_type === 'release' && b.version_type !== 'release') return -1;
      if (a.version_type !== 'release' && b.version_type === 'release') return 1;
      return new Date(b.release_time).getTime() - new Date(a.release_time).getTime();
    });

    // Combine: latest release, latest snapshot, then others
    const result = [];
    if (latestRelease) result.push({ ...latestRelease, isLatestRelease: true });
    if (latestSnapshot) result.push({ ...latestSnapshot, isLatestSnapshot: true });
    result.push(...sortedOthers);

    return result;
  }, [versions, searchTerm, showNonReleases]);

  const selectedVersionInfo = versions.find((v) => v.id === selectedVersion);
  const selectedInfo = selectedVersionInfo ? getVersionInfo(selectedVersionInfo) : null;

  return (
    <div className="relative">
      <label htmlFor="version-select" className="block text-sm font-medium text-gray-700 mb-2">
        Minecraft Version
      </label>

      {/* Custom Select Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed text-left bg-white flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{selectedVersion}</span>
            {selectedInfo && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${selectedInfo.bg} ${selectedInfo.color}`}
              >
                {selectedInfo.label}
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search versions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Show Non-Releases Checkbox */}
              <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNonReleases}
                  onChange={(e) => setShowNonReleases(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Show snapshots, pre-releases, and RCs
              </label>
            </div>

            {/* Version List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredVersions.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">No versions found</div>
              ) : (
                filteredVersions.map((version) => {
                  const info = getVersionInfo(version);
                  const isSelected = version.id === selectedVersion;
                  const isLatestRelease = (version as { isLatestRelease?: boolean })
                    .isLatestRelease;
                  const isLatestSnapshot = (version as { isLatestSnapshot?: boolean })
                    .isLatestSnapshot;

                  return (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => {
                        onVersionChange(version.id);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                      } ${isLatestRelease || isLatestSnapshot ? 'border-b-2 border-gray-200' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{version.id}</span>
                        {isLatestRelease && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold">
                            Latest
                          </span>
                        )}
                        {isLatestSnapshot && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                            Latest Snapshot
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${info.bg} ${info.color}`}
                        >
                          {info.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(version.release_time).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
