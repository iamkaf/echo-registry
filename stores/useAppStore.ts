import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DependencyVersion, MinecraftVersion } from '@/types/dependency';
import { POPULAR_MODRINTH_PROJECTS, UI_CONSTANTS } from '@/lib/utils/constants';
import { formatApiTimestamp } from '@/lib/utils/dateUtils';
import { getStoredProjects, setStoredProjects } from '@/lib/utils/storePersistence';

interface AppState {
  // Data state
  dependencies: DependencyVersion[];
  minecraftVersions: MinecraftVersion[];
  selectedVersion: string | null;
  projects: string[];

  // UI state
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isInitialLoad: boolean;

  // New app state properties
  appReady: boolean;
  initialLoadingComplete: boolean;
  loadingPhase: 'idle' | 'fetching_versions' | 'fetching_dependencies' | 'complete' | 'error';
  loadingMessage: string;

  // Request tracking properties
  activeRequests: Set<string>;
  loadingState: 'idle' | 'loading' | 'error';
  loadingContext: string | null;

  // Version change tracking
  selectedVersionFromInitialization: boolean;

  // Project management actions
  addProject: (project: string) => void;
  removeProject: (projectToRemove: string) => void;
  moveProject: (index: number, direction: 'up' | 'down') => void;

  // Actions
  setDependencies: (deps: DependencyVersion[]) => void;
  setMinecraftVersions: (versions: MinecraftVersion[]) => void;
  setSelectedVersion: (version: string | null) => void;
  setSelectedVersionFromInitialization: (fromInitialization: boolean) => void;
  setProjects: (projects: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (timestamp: string | null) => void;
  setInitialLoad: (isInitialLoad: boolean) => void;
  setAppReady: (appReady: boolean) => void;
  setInitialLoadingComplete: (initialLoadingComplete: boolean) => void;
  setLoadingPhase: (
    phase: 'idle' | 'fetching_versions' | 'fetching_dependencies' | 'complete' | 'error',
  ) => void;
  setLoadingMessage: (message: string) => void;

  // Request management actions
  startRequest: (requestId: string, context?: string) => void;
  endRequest: (requestId: string) => void;
  setLoadingState: (state: 'idle' | 'loading' | 'error') => void;
  setLoadingContext: (context: string | null) => void;

  // Async actions
  fetchMinecraftVersions: () => Promise<void>;
  fetchDependencies: (mcVersion: string, projects?: string[]) => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  initializeApp: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      dependencies: [],
      minecraftVersions: [],
      selectedVersion: null,
      projects:
        getStoredProjects().length > 0 ? getStoredProjects() : [...POPULAR_MODRINTH_PROJECTS],
      loading: true,
      error: null,
      lastUpdated: null,
      isInitialLoad: true,

      // New app state properties
      appReady: false,
      initialLoadingComplete: false,
      loadingPhase: 'idle',
      loadingMessage: 'Initializing...',

      // Request tracking properties
      activeRequests: new Set(),
      loadingState: 'idle',
      loadingContext: null,

      // Version change tracking
      selectedVersionFromInitialization: false,

      // Synchronous actions
      setDependencies: (deps) => set({ dependencies: deps }),
      setMinecraftVersions: (versions) => set({ minecraftVersions: versions }),
      setSelectedVersion: (version) => set({ selectedVersion: version }),
      setSelectedVersionFromInitialization: (fromInitialization) =>
        set({ selectedVersionFromInitialization: fromInitialization }),
      setProjects: (projects) => {
        set({ projects });
        setStoredProjects(projects);
      },
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setLastUpdated: (lastUpdated) => set({ lastUpdated }),
      setInitialLoad: (isInitialLoad) => set({ isInitialLoad }),
      setAppReady: (appReady) => set({ appReady }),
      setInitialLoadingComplete: (initialLoadingComplete) => set({ initialLoadingComplete }),
      setLoadingPhase: (phase) => set({ loadingPhase: phase }),
      setLoadingMessage: (message) => set({ loadingMessage: message }),

      // Request management actions
      startRequest: (requestId: string, context?: string) => {
        set((state) => ({
          activeRequests: new Set([...state.activeRequests, requestId]),
          loadingState: 'loading',
          loadingContext: context || 'Loading...',
          loading: true, // Maintain backward compatibility
        }));
      },

      endRequest: (requestId: string) => {
        set((state) => {
          const newActiveRequests = new Set(state.activeRequests);
          newActiveRequests.delete(requestId);

          return {
            activeRequests: newActiveRequests,
            loadingState: newActiveRequests.size === 0 ? 'idle' : 'loading',
            loadingContext: newActiveRequests.size === 0 ? null : state.loadingContext,
            loading: newActiveRequests.size === 0 ? false : true,
          };
        });
      },

      setLoadingState: (state: 'idle' | 'loading' | 'error') => set({ loadingState: state }),
      setLoadingContext: (context: string | null) => set({ loadingContext: context }),

      // Project management actions
      addProject: (project: string) => {
        const currentProjects = get().projects;
        const normalizedProject = project.trim().toLowerCase();
        if (normalizedProject && !currentProjects.includes(normalizedProject)) {
          const newProjects = [...currentProjects, normalizedProject];
          get().setProjects(newProjects);
        }
      },

      removeProject: (projectToRemove: string) => {
        const currentProjects = get().projects;
        const newProjects = currentProjects.filter((p) => p !== projectToRemove);
        get().setProjects(newProjects);
      },

      moveProject: (index: number, direction: 'up' | 'down') => {
        const currentProjects = get().projects;
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex >= 0 && newIndex < currentProjects.length) {
          const newProjects = [...currentProjects];
          [newProjects[index], newProjects[newIndex]] = [newProjects[newIndex], newProjects[index]];
          get().setProjects(newProjects);
        }
      },

      // Async actions
      fetchMinecraftVersions: async () => {
        const requestId = `minecraft-versions-${Date.now()}`;

        try {
          get().startRequest(requestId, 'Fetching Minecraft versions...');

          const response = await fetch('/api/versions/minecraft');
          const data = await response.json();

          if (data.error) {
            get().setError(data.error);
          } else {
            get().setMinecraftVersions(data.data.versions);
            get().clearError();
          }
        } catch (error) {
          console.error('Failed to fetch Minecraft versions:', error);
          get().setError('Failed to fetch Minecraft versions');
        } finally {
          get().endRequest(requestId);
        }
      },

      fetchDependencies: async (mcVersion: string, projects?: string[]) => {
        const requestId = `dependencies-${mcVersion}-${Date.now()}`;

        try {
          get().startRequest(requestId, `Loading dependencies for ${mcVersion}...`);
          get().clearError();

          const projectsToUse = projects || get().projects;
          let url: string;

          if (typeof window !== 'undefined') {
            url = new URL(
              '/api/versions/dependencies/' + mcVersion,
              window.location.origin,
            ).toString();
          } else {
            url = '/api/versions/dependencies/' + mcVersion;
          }

          const requestUrl = new URL(
            url,
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          );
          if (projectsToUse.length > 0) {
            requestUrl.searchParams.set('projects', projectsToUse.join(','));
          }

          const response = await fetch(requestUrl.toString());
          const data = await response.json();

          if (data.error) {
            get().setError(data.error);
          } else {
            get().setDependencies(data.data.dependencies);
            // Only set selected version if it's not already set (for manual refreshes)
            if (!get().selectedVersion) {
              get().setSelectedVersion(data.data.mc_version);
            }
            get().setLastUpdated(formatApiTimestamp());
            get().clearError();
          }
        } catch (error) {
          console.error(`Failed to fetch dependencies for ${mcVersion}:`, error);
          get().setError(`Failed to fetch dependencies for ${mcVersion}`);
        } finally {
          get().endRequest(requestId);
          get().setInitialLoad(false);
        }
      },

      refreshData: async () => {
        const { selectedVersion, projects } = get();
        if (selectedVersion) {
          await Promise.all([
            get().fetchMinecraftVersions(),
            get().fetchDependencies(selectedVersion, projects),
          ]);
        }
      },

      clearError: () => set({ error: null }),

      initializeApp: async () => {
        try {
          get().setLoadingPhase('fetching_versions');
          get().setLoadingMessage('Fetching Minecraft versions...');
          get().clearError();

          await get().fetchMinecraftVersions();

          const versions = get().minecraftVersions;
          if (versions.length === 0) {
            throw new Error('No Minecraft versions available');
          }

          const latestRelease = versions
            .filter((v) => v.version_type === 'release')
            .sort(
              (a, b) => new Date(b.release_time).getTime() - new Date(a.release_time).getTime(),
            )[0];

          if (!latestRelease) {
            throw new Error('No release versions found');
          }

          const latestVersion = latestRelease.id;
          get().setSelectedVersion(latestVersion);
          get().setSelectedVersionFromInitialization(true);

          get().setLoadingPhase('fetching_dependencies');
          get().setLoadingMessage('Loading latest Forge, NeoForge, Fabric, and mod versions...');

          await get().fetchDependencies(latestVersion);

          get().setLoadingPhase('complete');
          get().setLoadingMessage('Almost ready...');

          // Small delay for smooth transition
          await new Promise((resolve) => setTimeout(resolve, UI_CONSTANTS.SPLASH_SCREEN_DELAY));

          get().setAppReady(true);
          get().setInitialLoadingComplete(true);
        } catch (error) {
          console.error('Failed to initialize app:', error);
          get().setLoadingPhase('error');
          get().setLoadingMessage('Failed to load data');
          get().setError(
            error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Unknown error occurred',
          );
        }
      },
    }),
    {
      name: 'echo-registry-store',
    },
  ),
);

// Selectors for specific data
export const useDependencies = () => useAppStore((state) => state.dependencies);
export const useMinecraftVersions = () => useAppStore((state) => state.minecraftVersions);
export const useSelectedVersion = () => useAppStore((state) => state.selectedVersion);
export const useProjects = () => useAppStore((state) => state.projects);
export const useLoading = () => useAppStore((state) => state.loading);
export const useError = () => useAppStore((state) => state.error);
export const useLastUpdated = () => useAppStore((state) => state.lastUpdated);
export const useIsInitialLoad = () => useAppStore((state) => state.isInitialLoad);

// New app state selectors
export const useAppReady = () => useAppStore((state) => state.appReady);
export const useInitialLoadingComplete = () => useAppStore((state) => state.initialLoadingComplete);
export const useLoadingPhase = () => useAppStore((state) => state.loadingPhase);
export const useLoadingMessage = () => useAppStore((state) => state.loadingMessage);

// Request tracking selectors
export const useActiveRequests = () => useAppStore((state) => state.activeRequests);
export const useLoadingState = () => useAppStore((state) => state.loadingState);
export const useLoadingContext = () => useAppStore((state) => state.loadingContext);
export const useIsAnyRequestLoading = () => useAppStore((state) => state.activeRequests.size > 0);
export const useActiveRequestCount = () => useAppStore((state) => state.activeRequests.size);
export const useIsRequestActive = (requestId: string) =>
  useAppStore((state) => state.activeRequests.has(requestId));

// Version change tracking selector
export const useSelectedVersionFromInitialization = () =>
  useAppStore((state) => state.selectedVersionFromInitialization);

// Project management action selectors
export const useAddProject = () => useAppStore((state) => state.addProject);
export const useRemoveProject = () => useAppStore((state) => state.removeProject);
export const useMoveProject = () => useAppStore((state) => state.moveProject);

// Actions as individual hooks to avoid infinite re-renders
export const useSetDependencies = () => useAppStore((state) => state.setDependencies);
export const useSetMinecraftVersions = () => useAppStore((state) => state.setMinecraftVersions);
export const useSetSelectedVersion = () => useAppStore((state) => state.setSelectedVersion);
export const useSetSelectedVersionFromInitialization = () =>
  useAppStore((state) => state.setSelectedVersionFromInitialization);
export const useSetProjects = () => useAppStore((state) => state.setProjects);
export const useSetLoading = () => useAppStore((state) => state.setLoading);
export const useSetError = () => useAppStore((state) => state.setError);
export const useSetLastUpdated = () => useAppStore((state) => state.setLastUpdated);
export const useSetInitialLoad = () => useAppStore((state) => state.setInitialLoad);
export const useSetAppReady = () => useAppStore((state) => state.setAppReady);
export const useSetInitialLoadingComplete = () =>
  useAppStore((state) => state.setInitialLoadingComplete);
export const useSetLoadingPhase = () => useAppStore((state) => state.setLoadingPhase);
export const useSetLoadingMessage = () => useAppStore((state) => state.setLoadingMessage);

// Request management action hooks
export const useStartRequest = () => useAppStore((state) => state.startRequest);
export const useEndRequest = () => useAppStore((state) => state.endRequest);
export const useSetLoadingState = () => useAppStore((state) => state.setLoadingState);
export const useSetLoadingContext = () => useAppStore((state) => state.setLoadingContext);

export const useFetchMinecraftVersions = () => useAppStore((state) => state.fetchMinecraftVersions);
export const useFetchDependencies = () => useAppStore((state) => state.fetchDependencies);
export const useRefreshData = () => useAppStore((state) => state.refreshData);
export const useClearError = () => useAppStore((state) => state.clearError);
export const useInitializeApp = () => useAppStore((state) => state.initializeApp);

// Combined actions hook for convenience
export const useAppActions = () => {
  const store = useAppStore();

  // Return stable function references to avoid re-renders
  return {
    setDependencies: store.setDependencies,
    setMinecraftVersions: store.setMinecraftVersions,
    setSelectedVersion: store.setSelectedVersion,
    setSelectedVersionFromInitialization: store.setSelectedVersionFromInitialization,
    setProjects: store.setProjects,
    setLoading: store.setLoading,
    setError: store.setError,
    setLastUpdated: store.setLastUpdated,
    setInitialLoad: store.setInitialLoad,
    setAppReady: store.setAppReady,
    setInitialLoadingComplete: store.setInitialLoadingComplete,
    setLoadingPhase: store.setLoadingPhase,
    setLoadingMessage: store.setLoadingMessage,
    startRequest: store.startRequest,
    endRequest: store.endRequest,
    setLoadingState: store.setLoadingState,
    setLoadingContext: store.setLoadingContext,
    fetchMinecraftVersions: store.fetchMinecraftVersions,
    fetchDependencies: store.fetchDependencies,
    refreshData: store.refreshData,
    clearError: store.clearError,
    initializeApp: store.initializeApp,
    // Project management actions
    addProject: store.addProject,
    removeProject: store.removeProject,
    moveProject: store.moveProject,
  };
};
