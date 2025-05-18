'use client';

import {
	PoolsResponse,
	RecentTradeItem,
	TradeItem,
	TradesResponse,
} from '@/graphql/gtx/clob';
import { formatPrice, formatTime } from '@/lib/utils';
import { useMarketStore } from '@/store/market-store';
import { ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { ClobDexComponentProps } from '../clob-dex';

interface Trade {
	price: number;
	time: string;
	size: bigint;
	side: 'Buy' | 'Sell';
	total?: number;
}

export type RecentTradesComponentProps = ClobDexComponentProps & {
	poolsData?: PoolsResponse;
	poolsLoading?: boolean;
	poolsError?: Error | null;
	tradesData?: RecentTradeItem[];
	tradesLoading?: boolean;
	tradesError?: Error | null;
};

const RecentTradesComponent = ({
	chainId,
	defaultChainId,
	poolsData,
	poolsLoading,
	poolsError,
	tradesData,
	tradesLoading,
	tradesError,
}: RecentTradesComponentProps) => {
	const [mounted, setMounted] = useState(false);

	const { baseDecimals, quoteDecimals } = useMarketStore();

	useEffect(() => {
		setMounted(true);
	}, []);

	const processTrades = (items: RecentTradeItem[]): Trade[] => {
		// Sort trades by timestamp (newest first)
		const sortedTrades = [...items].sort((a, b) => b.timestamp - a.timestamp);

		// Process each trade
		return sortedTrades.slice(0, 25).map((trade, index, array) => {
			// Convert price from string to number (assuming price is in wei)
			const priceNum = Number(trade.price);

			// Determine the side of the trade using a simple heuristic:
			// If the price is higher than the previous trade, it's a buy, otherwise it's a sell
			// For the first trade, we'll default to 'Buy'
			let side: 'Buy' | 'Sell' = 'Buy';
			if (index > 0) {
				const prevPrice = Number(array[index - 1].price);
				side = priceNum >= prevPrice ? 'Buy' : 'Sell';
			}

			return {
				price: priceNum,
				size: BigInt(trade.quantity),
				side: side,
				time: formatTime(trade.timestamp),
			};
		});
	};

	const calculateTotal = (trades: Trade[]): Trade[] => {
		let runningTotal = 0;
		return trades.map((trade) => {
			runningTotal += Number(trade.size);
			return { ...trade, total: runningTotal };
		});
	};

	if (!mounted || tradesLoading) {
		return <RecentTradesSkeleton />;
	}

	if (tradesError) {
		return (
			<div className="w-full rounded-xl border border-gray-800/30 bg-gray-950 p-4 text-white">
				<div className="flex items-center gap-2 text-rose-400">
					<span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
					<span>Error loading trades</span>
				</div>
				<p className="mt-2 text-sm text-gray-300">{tradesError.toString()}</p>
			</div>
		);
	}

	const trades = calculateTotal(
		processTrades((tradesData as RecentTradeItem[]) || [])
	);

	return (
		<div className="w-full overflow-hidden rounded-xl border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 text-white shadow-lg">
			{/* Header */}
			{/* <div className="flex items-center justify-between border-b border-gray-800/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-white">Recent Trades</h2>
        </div>
      </div> */}

			<div className="flex h-[550px] flex-col rounded-lg">
				{/* Column Headers */}
				<div className="sticky top-0 z-10 border-b border-gray-800/30 bg-gray-900/40 px-4 py-2">
					<div className="grid grid-cols-3 items-center text-xs font-medium text-gray-300">
						<div className="flex items-center gap-1">Price</div>
						<div className="flex items-center justify-center gap-1">
							<Clock className="h-3.5 w-3.5" />
							<span>Time</span>
						</div>
						<div className="text-right">Size</div>
					</div>
				</div>

				{/* Trades List */}
				<div className="flex-1 px-0 py-2 overflow-auto [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-900">
					<div className="space-y-[2px]">
						{trades.map((trade, i) => {
							const maxTotal = Math.max(...trades.map((t) => t.total || 0));
							const percentageWidth = ((trade.total || 0) * 100) / maxTotal;

							return (
								<div key={i} className="group relative">
									{/* Background bar */}
									<div
										className={`absolute bottom-0 left-0 top-0 transition-all ${
											trade.side === 'Buy'
												? 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
												: 'bg-rose-500/10 group-hover:bg-rose-500/20'
										}`}
										style={{
											width: `${percentageWidth}%`,
										}}
									/>

									{/* Trade data */}
									<div className="relative grid grid-cols-3 px-4 py-1.5 text-xs">
										<div className="flex items-center gap-1">
											{trade.side === 'Buy' ? (
												<ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
											) : (
												<ArrowDown className="h-3.5 w-3.5 text-rose-400" />
											)}
											<span
												className={`font-medium ${
													trade.side === 'Buy'
														? 'text-emerald-400'
														: 'text-rose-400'
												}`}
											>
												{formatPrice(
													formatUnits(
														BigInt(Math.floor(trade.price)),
														quoteDecimals
													)
												)}
											</span>
										</div>
										<div className="text-center font-medium text-gray-200">
											{trade.time}
										</div>
										<div className="text-right font-medium text-gray-200">
											{formatPrice(
												formatUnits(BigInt(trade.size), baseDecimals)
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

const RecentTradesSkeleton = () => {
	return (
		<div className="w-full rounded-xl border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 text-white">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-gray-800/30 px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="h-5 w-5 animate-pulse rounded-md bg-gray-800/50" />
					<div className="h-4 w-24 animate-pulse rounded bg-gray-800/50" />
				</div>
				<div className="h-7 w-7 animate-pulse rounded-full bg-gray-800/50" />
			</div>

			<div className="p-4">
				{/* Column Headers */}
				<div className="mb-4 grid grid-cols-3">
					<div className="h-3 w-12 animate-pulse rounded bg-gray-800/30" />
					<div className="mx-auto h-3 w-12 animate-pulse rounded bg-gray-800/30" />
					<div className="ml-auto h-3 w-12 animate-pulse rounded bg-gray-800/30" />
				</div>

				{/* Skeleton Rows */}
				<div className="space-y-3">
					{[...Array(10)].map((_, i) => (
						<div key={i} className="grid grid-cols-3 gap-4">
							<div className="h-3 w-20 animate-pulse rounded bg-gray-800/20" />
							<div className="mx-auto h-3 w-16 animate-pulse rounded bg-gray-800/20" />
							<div className="ml-auto h-3 w-14 animate-pulse rounded bg-gray-800/20" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default RecentTradesComponent;
