import { rariTestnet } from '@/configs/wagmi'
import { createConfig, http } from 'wagmi'

// export const wagmiConfig = createConfig({
//   chains: [riseTestnet],
//   transports: {
//     [riseTestnet.id]: http()
//   },
// }) 

export const wagmiConfig = createConfig({
  chains: [rariTestnet],
  transports: {
    [rariTestnet.id]: http()
  },
}) 