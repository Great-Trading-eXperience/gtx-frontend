export const OrderBookSkeleton = () => {
    return (
        <div className="w-full max-w-xs mx-auto bg-gray-900 rounded-xl border border-gray-800 text-white p-4 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-800 rounded" />
                    <div className="w-8 h-8 bg-gray-800 rounded" />
                </div>
                <div className="w-16 h-8 bg-gray-800 rounded" />
            </div>

            <div>
                <div className="grid grid-cols-2 mb-2">
                    <div className="w-12 h-4 bg-gray-800 rounded" />
                    <div className="w-12 h-4 bg-gray-800 rounded ml-auto" />
                </div>

                <div className="space-y-1 mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={`ask-${i}`} className="grid grid-cols-2 gap-4">
                            <div className="w-20 h-4 bg-gray-800 rounded" />
                            <div className="w-20 h-4 bg-gray-800 rounded ml-auto" />
                        </div>
                    ))}
                </div>

                <div className="py-4 flex justify-between">
                    <div className="w-24 h-4 bg-gray-800 rounded" />
                    <div className="w-20 h-4 bg-gray-800 rounded" />
                </div>

                <div className="space-y-1">
                    {[...Array(8)].map((_, i) => (
                        <div key={`bid-${i}`} className="grid grid-cols-2 gap-4">
                            <div className="w-20 h-4 bg-gray-800 rounded" />
                            <div className="w-20 h-4 bg-gray-800 rounded ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};