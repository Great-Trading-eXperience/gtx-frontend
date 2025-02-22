import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useRouter } from "next/navigation"

interface Pair {
  icon: string
  name: string
}

interface Asset {
  icon: string
  symbol: string
  name: string
  pairs: Pair[]
  apy: string
  tvl: string
}

const assets: Asset[] = [
  {
    icon: "/usdc.png",
    symbol: "USDC",
    name: "Curator 3",
    pairs: [{ icon: "/bitcoin.png", name: "BTC/USDT" }],
    apy: "12.5%",
    tvl: "$1.2M",
  },
  {
    icon: "/usdc.png",
    symbol: "USDC",
    name: "Curator 1",
    pairs: [
      { icon: "/eth.png", name: "ETH/USDT" },
      { icon: "/bitcoin.png", name: "BTC/USDT" },
    ],
    apy: "10.2%",
    tvl: "$800K",
  },
  {
    icon: "/usdc.png",
    symbol: "USDC",
    name: "Curator 2",
    pairs: [{ icon: "/eth.png", name: "ETH/USDT" }],
    apy: "11.8%",
    tvl: "$1.5M",
  },
]

export default function LiquidbookEarn() {
  const router = useRouter()

  const handleRowClick = (asset: Asset) => {
    router.push(`/earn/0xe9c1de5ea494219b965652`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white">
      <header className="px-4 py-4 bg-black/50 backdrop-blur-md shadow-2xl border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo/gtx-white.png" className="h-10" alt="GTX Logo" />
            <span className="text-3xl font-bold bg-clip-text text-white bg-gradient-to-r from-blue-400 to-cyan-300">
              GTX
            </span>
          </Link>

          <nav className="hidden md:flex space-x-1">
            {["Spot", "Perpetual", "Earn"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-blue-500/10 transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </nav>

          <ConnectButton />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-start p-8">
        <div className="space-y-6 w-full max-w-7xl mx-auto">
          <div className="text-start space-y-4">
            <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              GTX Earn
            </h1>
            <p className="text-xl text-gray-300 mx-auto">
              Maximize your crypto assets potential. <br />
              Deposit with our curators and watch your investments grow across
              diverse trading pairs.
            </p>
          </div>

          <div className="w-full bg-black/30 backdrop-blur-sm rounded-lg border border-blue-500/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-blue-500/20">
                  <TableHead className="text-blue-300">Asset</TableHead>
                  <TableHead className="text-blue-300">Name</TableHead>
                  <TableHead className="text-blue-300">Market</TableHead>
                  <TableHead className="text-right text-blue-300">APY</TableHead>
                  <TableHead className="text-right text-blue-300">TVL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset, i) => (
                  <TableRow
                    key={i}
                    className="hover:bg-blue-500/5 border-blue-500/20 cursor-pointer transition-colors duration-200"
                    onClick={() => handleRowClick(asset)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 p-0.5">
                          <img
                            src={asset.icon}
                            alt={asset.symbol}
                            className="w-full h-full rounded-full bg-black"
                          />
                        </div>
                        <span>{asset.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {asset.pairs.map((pair, j) => (
                          <div key={j} className="flex items-center gap-2 bg-blue-500/10 rounded-full px-3 py-1">
                            <img src={pair.icon} alt={pair.name} className="w-4 h-4 rounded-full" />
                            <span className="text-sm text-blue-300">{pair.name}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-400">{asset.apy}</TableCell>
                    <TableCell className="text-right text-cyan-300">{asset.tvl}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full border-blue-500/50 bg-black/30 hover:bg-blue-500/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2 text-lg">
              <span className="px-4 py-2 bg-blue-500/10 rounded-lg">1</span>
              <span className="text-gray-400">of 1</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full border-blue-500/50 bg-black/30 hover:bg-blue-500/10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}