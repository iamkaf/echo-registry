import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

export interface DependencyItem {
  name: string;
  loader: string;
  version: string | null;
  mc_version: string;
  source_url?: string;
  coordinates?: string;
  icon_url?: string | null;
  notes?: string;
  fallback_used?: boolean;
}

export interface MinecraftVersion {
  id: string;
  version_type: string;
}

declare global {
  interface Window {
    __prefetch?: {
      versions?: Promise<any>;
      deps?: Promise<any>;
      depsUrl?: string;
    };
  }
}

export function useRegistryState() {
  const [minecraftVersions, setMinecraftVersions] = useState<MinecraftVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Default to the specific projects requested by user, persisted to localStorage
  const [projects, setProjects] = useLocalStorage<string[]>("echo-projects", [
    "amber",
    "modmenu",
    "forge-config-api-port",
    "architectury-api",
  ]);

  const [dependencies, setDependencies] = useState<DependencyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load: Fetch Minecraft versions — reuse the eagerly-fired promise from index.html
  useEffect(() => {
    const versionsPromise =
      window.__prefetch?.versions ?? fetch("/api/versions/minecraft").then((r) => r.json());

    versionsPromise
      .then((json) => {
        if (json.success && json.data?.versions) {
          const fetchedVersions = json.data.versions;
          setMinecraftVersions(fetchedVersions);

          if (fetchedVersions.length > 0 && !selectedVersion) {
            // Priority 1: Find latest release
            const latestRelease = fetchedVersions.find(
              (v: MinecraftVersion) => v.version_type === "release",
            );
            setSelectedVersion(latestRelease ? latestRelease.id : fetchedVersions[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load versions", err);
        setError("Failed to load Minecraft versions.");
      });
  }, []);

  // Fetch Dependencies whenever version or projects change
  const fetchDependencies = useCallback((version: string, currentProjects: string[]) => {
    if (!version) return;
    setLoading(true);
    setError(null);

    const query = currentProjects.length > 0 ? `?projects=${currentProjects.join(",")}` : "";
    const url = `/api/versions/dependencies/${version}${query}`;

    // Reuse the eagerly-fired promise if it matches the requested URL
    const pf = window.__prefetch;
    const depsPromise =
      pf?.depsUrl === url && pf?.deps ? pf.deps : fetch(url).then((r) => r.json());

    depsPromise
      .then((json) => {
        if (json.success && json.data?.dependencies) {
          setDependencies(json.data.dependencies);
        } else {
          setError(json.error || "Failed to load dependencies.");
          setDependencies([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load dependencies", err);
        setError("Network error loading dependencies.");
        setDependencies([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Effect to trigger fetch when version or projects change
  useEffect(() => {
    if (selectedVersion) {
      fetchDependencies(selectedVersion, projects);
    }
  }, [selectedVersion, projects, fetchDependencies]);

  const addProject = (project: string) => {
    if (project && !projects.includes(project)) {
      setProjects([...projects, project]);
    }
  };

  const removeProject = (project: string) => {
    setProjects(projects.filter((p) => p !== project));
  };

  const moveProject = (index: number, direction: "up" | "down") => {
    const newProjects = [...projects];
    if (direction === "up" && index > 0) {
      [newProjects[index - 1], newProjects[index]] = [newProjects[index], newProjects[index - 1]];
    } else if (direction === "down" && index < newProjects.length - 1) {
      [newProjects[index + 1], newProjects[index]] = [newProjects[index], newProjects[index + 1]];
    }
    setProjects(newProjects);
  };

  const refresh = () => {
    if (selectedVersion) {
      fetchDependencies(selectedVersion, projects);
    }
  };

  return {
    minecraftVersions,
    selectedVersion,
    setSelectedVersion,
    projects,
    addProject,
    removeProject,
    moveProject,
    dependencies,
    loading,
    error,
    refresh,
  };
}
