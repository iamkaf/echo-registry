export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-l-blue-400 border-r-blue-400"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-900">Fetching dependency versions</p>
          <p className="text-sm text-gray-500">
            Retrieving latest versions from Forge, NeoForge, Fabric, and Modrinth...
          </p>
        </div>
      </div>
    </div>
  );
}
