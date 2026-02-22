import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { Hero } from "./components/Hero";
import { Sidebar } from "./components/Sidebar";
import { DependencyGrid } from "./components/DependencyGrid";
import { useRegistryState } from "./hooks/useRegistryState";

export default function App() {
  const {
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
  } = useRegistryState();

  // Keep the health check logic running silently in the background
  useEffect(() => {
    fetch("/api/health")
      .catch((err) => console.error("Health check failed:", err));
  }, []);

  return (
    <Layout>
      <Hero />
      <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start relative max-w-7xl mx-auto w-full">
        <Sidebar
          versions={minecraftVersions}
          selectedVersion={selectedVersion}
          onVersionChange={setSelectedVersion}
          onRefresh={refresh}
          loading={loading}
          dependencies={dependencies}
          projects={projects}
          addProject={addProject}
          removeProject={removeProject}
          moveProject={moveProject}
        />

        <div className="flex-1 min-w-0 order-1 lg:order-2">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-8 text-sm">
              {error}
            </div>
          )}

          {selectedVersion ? (
            <DependencyGrid
              mcVersion={selectedVersion}
              dependencies={dependencies}
              loading={loading}
            />
          ) : (
            <div className="text-zinc-500 text-sm font-mono mt-4">Select a version to view dependencies.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
