import getConfig from 'next/config'

const { publicRuntimeConfig } = getConfig()

export const getGraphQLUrl = (chainId?: number): string => {
    const defaultChain = publicRuntimeConfig.NEXT_PUBLIC_DEFAULT_CHAIN || '31338'
    const envVarName = chainId 
        ? `NEXT_PUBLIC_CLOB_${chainId}_INDEXER_URL`
        : `NEXT_PUBLIC_CLOB_${defaultChain}_INDEXER_URL`
    
    const url = publicRuntimeConfig[envVarName]
    if (!url) {
        console.error(`Environment variable ${envVarName} not found`)
        throw new Error(`GraphQL URL not found for chain ${chainId || defaultChain}`)
    }
    return url
} 

export const getBalanceManagerAddress = (chainId?: number): string => {
    const defaultChain = publicRuntimeConfig.NEXT_PUBLIC_DEFAULT_CHAIN || '31338'
    const envVarName = chainId 
        ? `NEXT_PUBLIC_BALANCE_MANAGER_${chainId}_ADDRESS`
        : `NEXT_PUBLIC_BALANCE_MANAGER_${defaultChain}_ADDRESS`
    return publicRuntimeConfig[envVarName]
}

export const getPoolManagerAddress = (chainId?: number): string => {
    const defaultChain = publicRuntimeConfig.NEXT_PUBLIC_DEFAULT_CHAIN || '31338'
    const envVarName = chainId 
        ? `NEXT_PUBLIC_POOL_MANAGER_${chainId}_ADDRESS`
        : `NEXT_PUBLIC_POOL_MANAGER_${defaultChain}_ADDRESS`
    return publicRuntimeConfig[envVarName]
}

export const getGTXRouterAddress = (chainId?: number): string => {
    const defaultChain = publicRuntimeConfig.NEXT_PUBLIC_DEFAULT_CHAIN || '31338'
    const envVarName = chainId 
        ? `NEXT_PUBLIC_GTX_ROUTER_${chainId}_ADDRESS`
        : `NEXT_PUBLIC_GTX_ROUTER_${defaultChain}_ADDRESS`
    
    return publicRuntimeConfig[envVarName]
}