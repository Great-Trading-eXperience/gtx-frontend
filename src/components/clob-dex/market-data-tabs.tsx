import { PoolItem } from "@/graphql/gtx/clob"

interface MarketDataTabsProps {
    address: string | undefined
    chainId: number | undefined
    defaultChainId: number
    poolsData: PoolItem[]
    poolsLoading: boolean
    poolsError: Error | null
}

export function MarketDataTabs({
    address,
    chainId,
    defaultChainId,
    poolsData,
    poolsLoading,
    poolsError
}: MarketDataTabsProps) {
    // Component implementation
    return (
        <div>
            {/* Component JSX */}
        </div>
    )
} 