import { useQuery } from "@tanstack/react-query";

export function useMarkets() {
    return useQuery({
        queryKey : ['markets'],
        queryFn: async () => {
            const response = await fetch('https://indexer-rise.gtxdex.xyz/api/markets');

            if (!response.ok) {
                throw new Error('Failed to fetch todos')
            }
            return response.json()
        }
    })
}