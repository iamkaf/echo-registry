import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Hero } from "./components/Hero";
import { VersionSelector } from "./components/VersionSelector";
import { DependencyGrid } from "./components/DependencyGrid";

export default function App() {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // We keep the health check logic running silently in the background
  // to power the "Systems Normal" indicator in the footer if needed.
  useEffect(() => {
    fetch("/api/health")
      .catch((err) => console.error("Health check failed:", err));
  }, []);

  return (
    <Layout>
      <Hero />
      <div className="mt-8">
        <VersionSelector
          selectedVersion={selectedVersion}
          onSelect={setSelectedVersion}
        />

        {selectedVersion && (
          <div className="mt-8">
            <DependencyGrid mcVersion={selectedVersion} />
          </div>
        )}
      </div>
    </Layout>
  );
}
