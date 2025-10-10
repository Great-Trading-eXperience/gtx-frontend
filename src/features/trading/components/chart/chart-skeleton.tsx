import Image from 'next/image';
import { memo } from 'react';

interface ChartSkeletonProps {
  height?: number;
  showHeader?: boolean;
}

function ChartSkeleton({ height = 450, showHeader = true }: ChartSkeletonProps) {
  return (
    <div
      className="w-full bg-black border border-gray-700 rounded-lg overflow-hidden min-h-[450px]"
      style={{ height }}
    >
      <div className='flex items-center justify-center h-full'>
        <Image src={'/logo/gtx.png'} alt='logo' width={100} height={100} />
      </div>
    </div>
  );
}

export default memo(ChartSkeleton);
