'use client';

import { useEffect } from 'react';
import {
  useLoadingPhase,
  useLoadingMessage,
  useAppReady,
  useError,
  useInitializeApp,
} from '@/stores/useAppStore';

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const loadingPhase = useLoadingPhase();
  const loadingMessage = useLoadingMessage();
  const appReady = useAppReady();
  const error = useError();
  const initializeApp = useInitializeApp();

  // Initialize app on component mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Call onComplete when app is ready
  useEffect(() => {
    if (appReady && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 300); // Small delay for smooth transition
      return () => clearTimeout(timer);
    }
  }, [appReady, onComplete]);

  const getPhaseIcon = () => {
    switch (loadingPhase) {
      case 'fetching_versions':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        );
      case 'fetching_dependencies':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
        );
      case 'complete':
        return (
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-600"></div>
        );
    }
  };

  const getPhaseColor = () => {
    switch (loadingPhase) {
      case 'fetching_versions':
        return 'text-blue-600';
      case 'fetching_dependencies':
        return 'text-green-600';
      case 'complete':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleRetry = () => {
    initializeApp();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-50">
      <div className="text-center max-w-md mx-auto px-6 w-full">
        {/* Logo/Branding */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Echo Registry</h1>
          <p className="text-lg text-gray-600">
            Latest Forge, NeoForge, Fabric, and popular mod versions
          </p>
        </div>

        {/* Loading Icon - Fixed height container */}
        <div className="flex justify-center mb-6 h-12">{getPhaseIcon()}</div>

        {/* Loading Message - Fixed height container */}
        <div className="mb-8 min-h-[4rem] flex flex-col justify-center">
          <p className={`text-lg font-medium ${getPhaseColor()} transition-colors duration-300`}>
            {loadingMessage}
          </p>
          {/* Always render the description container but conditionally show content */}
          <div className="text-sm text-gray-500 mt-2 min-h-[1.25rem]">
            {loadingPhase !== 'error' && loadingPhase !== 'complete' && (
              <>
                {loadingPhase === 'fetching_versions' && 'Checking available Minecraft versions...'}
                {loadingPhase === 'fetching_dependencies' &&
                  'Retrieving latest versions from Forge, NeoForge, Fabric, and Modrinth...'}
              </>
            )}
            {loadingPhase === 'error' && <>&nbsp;</>}
            {loadingPhase === 'complete' && <>&nbsp;</>}
          </div>
        </div>

        {/* Error and Complete States - Fixed height container */}
        <div className="mb-6 min-h-[5rem] flex flex-col justify-center">
          {/* Error State */}
          {error && loadingPhase === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <button
                onClick={handleRetry}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Complete State */}
          {loadingPhase === 'complete' && (
            <div className="animate-pulse">
              <p className="text-green-600 font-medium">Ready to launch!</p>
            </div>
          )}

          {/* Empty state for other phases */}
          {!error && loadingPhase !== 'error' && loadingPhase !== 'complete' && (
            <div className="opacity-0">
              <p className="text-gray-600 font-medium">Placeholder</p>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2">
          <div
            className={`h-2 w-2 rounded-full transition-colors duration-300 ${
              loadingPhase === 'fetching_versions' ||
              loadingPhase === 'fetching_dependencies' ||
              loadingPhase === 'complete'
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`}
          ></div>
          <div
            className={`h-2 w-2 rounded-full transition-colors duration-300 ${
              loadingPhase === 'fetching_dependencies' || loadingPhase === 'complete'
                ? 'bg-green-600'
                : 'bg-gray-300'
            }`}
          ></div>
          <div
            className={`h-2 w-2 rounded-full transition-colors duration-300 ${
              loadingPhase === 'complete' ? 'bg-green-600' : 'bg-gray-300'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
}
