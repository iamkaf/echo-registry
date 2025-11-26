import { useState } from 'react';
import { DependencyVersion } from '@/types/dependency';

interface GradleSnippetProps {
  dependencies: DependencyVersion[];
  mcVersion: string;
}

export default function GradleSnippet({ dependencies, mcVersion }: GradleSnippetProps) {
  const [copied, setCopied] = useState(false);

  const generateGradleProperties = () => {
    const lines: string[] = [];

    // Add Minecraft version
    lines.push(`minecraft_version=${mcVersion}`);

    // Add successful dependencies
    dependencies.forEach((dep) => {
      if (dep.version && dep.version !== 'N/A' && dep.version !== 'Error') {
        if (dep.name === 'parchment') {
          // Handle parchment version specially: separate version and minecraft fields
          lines.push(`parchment_version=${dep.version}`);
          lines.push(`parchment_minecraft=${dep.mc_version}`);
        } else {
          // Handle other dependencies normally
          const key = dep.name.replace(/[^a-zA-Z0-9]/g, '_');
          lines.push(`${key}_version=${dep.version}`);
        }
      }
    });

    return lines.join('\n');
  };

  const gradleProperties = generateGradleProperties();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gradleProperties);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-3 lg:p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">gradle.properties</h3>
        <button
          onClick={copyToClipboard}
          className={`text-xs px-2 py-1 rounded transition-all duration-200 flex-shrink-0 ${
            copied ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </span>
          ) : (
            'Copy'
          )}
        </button>
      </div>
      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
        {gradleProperties || 'No valid versions to export'}
      </pre>
    </div>
  );
}
