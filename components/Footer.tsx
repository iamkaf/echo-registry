'use client';

import { getAppVersion, getGitCommit } from '@/lib/utils/versionUtils';

export default function Footer() {
  const version = getAppVersion();
  const commit = getGitCommit();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-500">© {currentYear} Echo Registry</div>
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>v{version}</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-mono hidden sm:inline">{commit}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
