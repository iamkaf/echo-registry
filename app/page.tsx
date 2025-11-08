'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DependencyVersion, MinecraftVersion } from '@/types/dependency';
import VersionTable from '@/components/VersionTable';
import Sidebar from '@/components/Sidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { POPULAR_MODRINTH_PROJECTS } from '@/lib/utils/constants';

// This ensures the page is always dynamically rendered
export const dynamic = 'force-dynamic';

export default function Home() {
  const [dependencies, setDependencies] = useState<DependencyVersion[]>([]);
  const [minecraftVersions, setMinecraftVersions] = useState<MinecraftVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('1.21.1'); // Initial fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [projects] = useLocalStorage<string[]>('echo-registry-projects', [...POPULAR_MODRINTH_PROJECTS]);
  const isInitialLoad = useRef(true);

  const fetchMinecraftVersions = async () => {
    try {
      const response = await fetch('/api/versions/minecraft');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMinecraftVersions(data.data.versions);
      }
    } catch {
      setError('Failed to fetch Minecraft versions');
    }
  };

  const fetchDependencies = useCallback(
    async (mcVersion: string) => {
      setLoading(true);
      setError(null);

      try {
        const projectsQuery = projects.join(',');
        const response = await fetch(`/api/versions/dependencies/${mcVersion}?projects=${projectsQuery}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setDependencies(data.data.dependencies);
          setLastUpdated(data.cached_at);
        }
      } catch {
        setError('Failed to fetch dependencies');
      } finally {
        setLoading(false);
      }
    },
    [projects],
  );

  useEffect(() => {
    fetchMinecraftVersions();
  }, []);

  // Set initial version to latest release when versions are loaded (only on initial load)
  useEffect(() => {
    if (minecraftVersions.length > 0 && isInitialLoad.current) {
      const latestRelease = minecraftVersions
        .filter((v) => v.version_type === 'release')
        .sort((a, b) => new Date(b.release_time).getTime() - new Date(a.release_time).getTime())[0];

      if (latestRelease) {
        setSelectedVersion(latestRelease.id);
        isInitialLoad.current = false;
      }
    }
  }, [minecraftVersions]);

  useEffect(() => {
    if (selectedVersion) {
      fetchDependencies(selectedVersion);
    }
  }, [selectedVersion, projects, fetchDependencies]);

  const handleRefresh = () => {
    fetchDependencies(selectedVersion);
  };

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    isInitialLoad.current = false; // Mark that user has made a selection
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-8">
        <header className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Echo Registry</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 px-2">
            Where dependency versions resonate - Latest Forge, NeoForge, Fabric, and popular mod versions
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Full width on mobile, fixed on desktop */}
          <div className="lg:w-80 lg:shrink-0">
            <Sidebar
              versions={minecraftVersions}
              selectedVersion={selectedVersion}
              onVersionChange={handleVersionChange}
              onRefresh={handleRefresh}
              loading={loading}
              dependencies={dependencies}
            />
          </div>

          {/* Main Content - Full width on mobile, takes remaining space on desktop */}
          <div className="flex-1 min-w-0">
            {loading && <LoadingSpinner />}

            {error && <ErrorMessage message={error} onRetry={handleRefresh} />}

            {!loading && !error && <VersionTable dependencies={dependencies} />}

            {/* Footer */}
            <footer className="mt-8 lg:mt-12 text-center text-gray-500 text-sm">
              <p>
                Data fetched from official sources.
                {lastUpdated && ` Last updated: ${new Date(lastUpdated).toLocaleString()}`}
              </p>
              <p className="mt-2">
                <a
                  href="/api/health"
                  className="text-blue-600 hover:underline mr-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API Health
                </a>
                <a
                  href="/openapi.json"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API Documentation
                </a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
