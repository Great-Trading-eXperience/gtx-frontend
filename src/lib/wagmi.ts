import { riseSepolia } from '@/configs/wagmi'
import { createConfig, http } from 'wagmi'

export const wagmiConfig = createConfig({
  chains: [riseSepolia],
  transports: {
    [riseSepolia.id]: http(),
  },
}) 