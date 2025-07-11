import { riseTestnet } from '@/configs/wagmi'
import { createConfig, http } from 'wagmi'

export const wagmiConfig = createConfig({
  chains: [riseTestnet],
  transports: {
    [riseTestnet.id]: http()
  },
}) 