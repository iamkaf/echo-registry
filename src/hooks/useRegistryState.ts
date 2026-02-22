import { useState, useEffect, useCallback } from 'react';

export interface DependencyItem {
    name: string;
    loader: string;
    version: string;
    mc_version: string;
    source_url?: string;
    coordinates?: string;
}

export function useRegistryState() {
    const [minecraftVersions, setMinecraftVersions] = useState<string[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [projects, setProjects] = useState<string[]>([]);
    const [dependencies, setDependencies] = useState<DependencyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load: Fetch Minecraft versions
    useEffect(() => {
        fetch('/api/versions/minecraft')
            .then(res => res.json() as Promise<any>)
            .then(json => {
                if (json.success && json.data?.versions) {
                    const fetchedVersions = json.data.versions.map((v: any) => v.id);
                    setMinecraftVersions(fetchedVersions);
                    if (fetchedVersions.length > 0 && !selectedVersion) {
                        setSelectedVersion(fetchedVersions[0]);
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load versions", err);
                setError("Failed to load Minecraft versions.");
            });
    }, []);

    // Fetch Dependencies whenever version or projects change
    const fetchDependencies = useCallback((version: string, currentProjects: string[]) => {
        if (!version) return;
        setLoading(true);
        setError(null);

        const query = currentProjects.length > 0
            ? `?projects=${currentProjects.join(',')}`
            : '';

        fetch(`/api/versions/dependencies/${version}${query}`)
            .then(res => res.json() as Promise<any>)
            .then(json => {
                if (json.success && json.data?.dependencies) {
                    setDependencies(json.data.dependencies);
                } else {
                    setError(json.error || "Failed to load dependencies.");
                    setDependencies([]);
                }
            })
            .catch(err => {
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
            setProjects(prev => [...prev, project]);
        }
    };

    const removeProject = (project: string) => {
        setProjects(prev => prev.filter(p => p !== project));
    };

    const moveProject = (index: number, direction: 'up' | 'down') => {
        setProjects(prev => {
            const newProjects = [...prev];
            if (direction === 'up' && index > 0) {
                [newProjects[index - 1], newProjects[index]] = [newProjects[index], newProjects[index - 1]];
            } else if (direction === 'down' && index < newProjects.length - 1) {
                [newProjects[index + 1], newProjects[index]] = [newProjects[index], newProjects[index + 1]];
            }
            return newProjects;
        });
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
        refresh
    };
}
