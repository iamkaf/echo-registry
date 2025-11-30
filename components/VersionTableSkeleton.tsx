// Helper function to get skeleton border colors (simulating different dependency types)
const getSkeletonBorderColor = (index: number): string => {
  const skeletonBorderColors = [
    'border-2 border-blue-400', // build tools
    'border-2 border-green-400', // mods
    'border-2 border-purple-400', // dev tools
    'border-2 border-blue-400', // build tools
    'border-2 border-green-400', // mods
    'border-2 border-purple-400', // dev tools
    'border-2 border-blue-400', // build tools
    'border-2 border-green-400'  // mods
  ];

  return skeletonBorderColors[index % skeletonBorderColors.length];
};

export default function VersionTableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className={`bg-white border ${getSkeletonBorderColor(index)} rounded-lg p-4 animate-pulse h-64 flex flex-col`}>
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Header: Name + Loader Badge */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-4 w-32 bg-gray-300 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-12 bg-gray-300 rounded-full"></div>
              </div>

              {/* Version Status */}
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="text-right space-y-1">
                  <div className="h-4 w-20 bg-gray-300 rounded ml-auto"></div>
                  <div className="h-3 w-28 bg-gray-200 rounded ml-auto"></div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <div className="h-3 w-12 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
              </div>

              {/* Source */}
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-300 rounded ml-auto"></div>
              </div>

              {/* Cache Timestamp */}
              <div className="h-3 w-32 bg-gray-200 rounded pt-2 border-t border-gray-100 mt-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
