export default function VersionTableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table Skeleton */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-3 w-20 bg-gray-300 rounded animate-pulse"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-3 w-12 bg-gray-300 rounded animate-pulse"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                <div className="h-3 w-12 bg-gray-300 rounded animate-pulse"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Skeleton rows - create 8 skeleton rows */}
            {[...Array(8)].map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-300 rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                  <div className="h-3 w-28 bg-gray-200 rounded mt-1"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="lg:hidden divide-y divide-gray-200">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-300 rounded"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 w-12 bg-gray-300 rounded-full"></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="space-y-1 text-right">
                  <div className="h-4 w-20 bg-gray-300 rounded ml-auto"></div>
                  <div className="h-3 w-28 bg-gray-200 rounded ml-auto"></div>
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="h-3 w-12 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-300 rounded text-right max-w-[60%]"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-300 rounded ml-auto"></div>
              </div>

              <div className="h-3 w-32 bg-gray-200 rounded text-center pt-2 border-t border-gray-100"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
