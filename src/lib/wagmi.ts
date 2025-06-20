import { riseSepolia } from '@/configs/wagmi'
import { createConfig, http } from 'wagmi'
import { localChain } from '@/configs/wagmi'

export const wagmiConfig = createConfig({
  chains: [riseSepolia, localChain],
  transports: {
    [riseSepolia.id]: http()
  },
}) 