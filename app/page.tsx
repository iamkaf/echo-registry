'use client';

import { useEffect, useRef } from 'react';
import VersionTable from '@/components/VersionTable';
import Sidebar from '@/components/Sidebar';
import SplashScreen from '@/components/SplashScreen';
import ErrorMessage from '@/components/ErrorMessage';
import {
  useDependencies,
  useMinecraftVersions,
  useSelectedVersion,
  useProjects,
  useLoading,
  useError,
  useAppReady,
  useInitialLoadingComplete,
  useSelectedVersionFromInitialization,
  useIsAnyRequestLoading,
  useLoadingContext,
  useAppActions,
} from '@/stores/useAppStore';

// This ensures the page is always dynamically rendered
export const dynamic = 'force-dynamic';

export default function Home() {
  // Get state from Zustand store
  const dependencies = useDependencies();
  const minecraftVersions = useMinecraftVersions();
  const selectedVersion = useSelectedVersion();
  const projects = useProjects();
  const loading = useLoading();
  const error = useError();
  const appReady = useAppReady();
  const initialLoadingComplete = useInitialLoadingComplete();
  const selectedVersionFromInitialization = useSelectedVersionFromInitialization();
  const isAnyRequestLoading = useIsAnyRequestLoading();
  const loadingContext = useLoadingContext();

  // Ref for tracking previous projects to detect changes
  const prevProjectsRef = useRef<string[]>(projects);

  // Get actions from Zustand store
  const {
    fetchDependencies,
    setSelectedVersion,
    setSelectedVersionFromInitialization,
    clearError,
  } = useAppActions();

  // Enhanced project change detection
  useEffect(() => {
    // Skip during initial loading phase
    if (!initialLoadingComplete) return;

    // Check if projects have actually changed (deep comparison)
    const projectsChanged =
      prevProjectsRef.current.length !== projects.length ||
      prevProjectsRef.current.some((project, index) => project !== projects[index]);

    if (projectsChanged && selectedVersion && !selectedVersionFromInitialization) {
      console.log('Projects changed, refetching dependencies...');
      fetchDependencies(selectedVersion, projects);
    }

    // Update the ref for next comparison
    prevProjectsRef.current = [...projects];
  }, [projects, selectedVersion, initialLoadingComplete, selectedVersionFromInitialization, fetchDependencies]);

  // Fetch dependencies when user changes versions (after initial load is complete)
  useEffect(() => {
    if (selectedVersion && initialLoadingComplete && !selectedVersionFromInitialization) {
      fetchDependencies(selectedVersion, projects);
      setSelectedVersionFromInitialization(false); // Reset flag
    }
  }, [selectedVersion, initialLoadingComplete, selectedVersionFromInitialization, fetchDependencies, setSelectedVersionFromInitialization, projects]);

  const handleRefresh = () => {
    if (selectedVersion) {
      clearError();
      fetchDependencies(selectedVersion);
    }
  };

  const handleVersionChange = (version: string) => {
    if (isAnyRequestLoading) {
      // Prevent version changes during ongoing requests
      console.log('Please wait for current request to complete');
      return;
    }

    setSelectedVersionFromInitialization(false); // Mark as user-initiated change
    setSelectedVersion(version);
    clearError();
  };

  // Show splash screen during initial loading
  if (!appReady) {
    return <SplashScreen />;
  }

  // Main app interface
  return (
    <main className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-8">
        <header className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Echo Registry
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 px-2">
            Latest Forge, NeoForge, Fabric, and popular mod versions for Minecraft
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Full width on mobile, fixed on desktop */}
          <div className="lg:w-80 lg:shrink-0">
            <Sidebar
              versions={minecraftVersions}
              selectedVersion={selectedVersion || ''}
              onVersionChange={handleVersionChange}
              onRefresh={handleRefresh}
              loading={loading}
              isAnyRequestLoading={isAnyRequestLoading}
              loadingContext={loadingContext}
              dependencies={dependencies}
              projects={projects}
            />
          </div>

          {/* Main Content - Full width on mobile, takes remaining space on desktop */}
          <div className="flex-1 min-w-0">
            {error && <ErrorMessage message={error} onRetry={handleRefresh} />}

            {!error && <VersionTable dependencies={dependencies} isLoading={isAnyRequestLoading} />}
          </div>
        </div>
      </div>
    </main>
  );
}