"use client"

import { useState } from "react"
import { ArrowUpDown, Calendar, Info, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function VotePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPeriod, setCurrentPeriod] = useState("Apr 2025")
  const [showOnlyVoted, setShowOnlyVoted] = useState(false)

  // Mock data - replace with actual data from your contract
  const userVotingPower = "498.35"
  const totalVotingPower = "8,234,567"
  const swapFeesLast7Days = "$91,068"
  const epochEndsIn = { days: 3, hours: 20, minutes: 7, seconds: 47 }
  const airdropAmount = "$306,192"
  const airdropAPR = "2.87"

  const topVoters = [
    { rank: 1, address: "0x516...0c7f", rewards: "0.1107 ETH", ethPer1000: "0.0675 (46.31%)", balance: "1,608" },
    { rank: 2, address: "0x89...8a1a", rewards: "0.6034 ETH", ethPer1000: "0.0419 (28.72%)", balance: "14,412" },
    { rank: 3, address: "0x8c8...e4fe", rewards: "0.4899 ETH", ethPer1000: "0.0401 (27.53%)", balance: "12,260" },
    { rank: 4, address: "0x1b3...ea03", rewards: "0.5064 ETH", ethPer1000: "0.0387 (26.54%)", balance: "13,148" },
    { rank: 5, address: "0x82e...3d0f", rewards: "0.4627 ETH", ethPer1000: "0.0386 (26.49%)", balance: "12,118" },
    { rank: 6, address: "0xa22...bfec", rewards: "5.3535 ETH", ethPer1000: "0.0381 (26.12%)", balance: "106,181" },
    { rank: 7, address: "0x2f...9328", rewards: "0.7299 ETH", ethPer1000: "0.0380 (26.07%)", balance: "19,233" },
    { rank: 8, address: "0x8bc...b918", rewards: "0.0389 ETH", ethPer1000: "0.0376 (25.82%)", balance: "1,076" },
    { rank: 9, address: "0xc8f...96e5", rewards: "0.0535 ETH", ethPer1000: "0.0374 (25.67%)", balance: "1,482" },
    { rank: 10, address: "0x877...0e95", rewards: "0.0559 ETH", ethPer1000: "0.0372 (25.53%)", balance: "1,499" },
  ]

  const pools = [
    {
      id: 1,
      name: "sUSDa Pool",
      protocol: "Avalon Finance",
      icon: "🔄",
      isNew: true,
      maturity: "28 Aug 2025",
      communityVote: "5.199%",
      communityVoteAmount: "2,003,975",
      voterAPR: "0.6429%",
      sevenDayFees: "$848",
      projCommunityVote: "5.19%",
      projCommunityVoteAmount: "1,995,033",
      projVoterAPR: "0.6457%",
      myVote: "0%",
      myVoteAmount: "0",
      myVotePercentage: 0,
    },
    {
      id: 2,
      name: "sUSDf Pool",
      protocol: "Falcon Finance",
      icon: "💰",
      isNew: true,
      maturity: "25 Sep 2025",
      communityVote: "3.794%",
      communityVoteAmount: "1,462,539",
      voterAPR: "2.663%",
      sevenDayFees: "$2,563",
      projCommunityVote: "3.899%",
      projCommunityVoteAmount: "1,498,539",
      projVoterAPR: "2.589%",
      myVote: "0%",
      myVoteAmount: "0",
      myVotePercentage: 0,
    },
    {
      id: 3,
      name: "SolvBTC-BNB Pool",
      protocol: "Solv Finance",
      icon: "🪙",
      isNew: true,
      maturity: "18 Dec 2025",
      communityVote: "2.547%",
      communityVoteAmount: "981,775",
      voterAPR: "0.343%",
      sevenDayFees: "$181",
      projCommunityVote: "2.543%",
      projCommunityVoteAmount: "977,428",
      projVoterAPR: "0.3445%",
      myVote: "0%",
      myVoteAmount: "0",
      myVotePercentage: 0,
    },
    {
      id: 4,
      name: "clisBNB Pool",
      protocol: "Lista",
      icon: "⚡",
      isNew: true,
      maturity: "30 Oct 2025",
      communityVote: "1.387%",
      communityVoteAmount: "534,578",
      voterAPR: "1.852%",
      sevenDayFees: "$653",
      projCommunityVote: "1.384%",
      projCommunityVoteAmount: "531,964",
      projVoterAPR: "1.861%",
      myVote: "0%",
      myVoteAmount: "0",
      myVotePercentage: 0,
    },
    {
      id: 5,
      name: "GTX-ETH Pool",
      protocol: "GTX Finance",
      icon: "🔄",
      isNew: true,
      maturity: "15 Jul 2025",
      communityVote: "4.123%",
      communityVoteAmount: "1,589,432",
      voterAPR: "1.245%",
      sevenDayFees: "$1,245",
      projCommunityVote: "4.156%",
      projCommunityVoteAmount: "1,598,765",
      projVoterAPR: "1.267%",
      myVote: "100%",
      myVoteAmount: "498.35",
      myVotePercentage: 100,
    },
  ]

  const filteredPools = pools.filter((pool) => {
    if (showOnlyVoted && pool.myVotePercentage === 0) return false
    if (searchQuery === "") return true
    return (
      pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.protocol.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const formatNumber = (num: string) => {
    return num
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Why Vote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              veGTX holders can channel GTX incentives to selected pools through governance voting. Voting into a pool
              will:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Direct GTX incentives into the pool</li>
              <li>Entitle you to earn a share of the pool swap fees, proportional to your votes</li>
            </ol>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  Swap fees last 7 days
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">
                          Total swap fees generated by all pools in the last 7 days. Vote to earn a share of these fees.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              </div>
              <p className="text-2xl font-bold">{swapFeesLast7Days}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">My veGTX:</span>
                <span className="font-medium">{userVotingPower} veGTX</span>
              </div>

              <div className="space-y-1">
                <div className="text-sm">Current epoch ends in</div>
                <div className="font-mono text-lg">
                  {epochEndsIn.days}d {epochEndsIn.hours}h {epochEndsIn.minutes}m {epochEndsIn.seconds}s
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center">
              Top Voters
              <Badge variant="outline" className="ml-2">
                {currentPeriod}
              </Badge>
            </CardTitle>
            <div className="flex items-center">
              <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apr 2025">Apr 2025</SelectItem>
                  <SelectItem value="Mar 2025">Mar 2025</SelectItem>
                  <SelectItem value="Feb 2025">Feb 2025</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-2 flex items-center">
                <Switch id="include-airdrops" />
                <Label htmlFor="include-airdrops" className="ml-2 text-xs">
                  Include Airdrops
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total Rewards</TableHead>
                  <TableHead className="text-right">ETH per 1000 veGTX (APR)</TableHead>
                  <TableHead className="text-right">veGTX Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVoters.map((voter) => (
                  <TableRow key={voter.rank}>
                    <TableCell className="font-medium">{voter.rank}</TableCell>
                    <TableCell className="font-mono">{voter.address}</TableCell>
                    <TableCell className="text-right">{voter.rewards}</TableCell>
                    <TableCell className="text-right">{voter.ethPer1000}</TableCell>
                    <TableCell className="text-right">{voter.balance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-xs text-muted-foreground mt-2">*Excluding users with &lt;1000 veGTX</div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-primary/20 flex items-center">
              <div className="mr-2 text-primary">🎁</div>
              <div className="flex-1">
                <span className="font-medium">Airdrop this month: </span>
                <span>
                  {airdropAmount} ({airdropAPR}% APR)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pool"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full md:w-[300px]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="flex-1 md:flex-none">
            7d Fees <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
          <Select defaultValue="$0">
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Min fees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="$0">$0</SelectItem>
              <SelectItem value="$100">$100</SelectItem>
              <SelectItem value="$500">$500</SelectItem>
              <SelectItem value="$1000">$1000</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center ml-2">
            <Switch id="show-voted" checked={showOnlyVoted} onCheckedChange={setShowOnlyVoted} />
            <Label htmlFor="show-voted" className="ml-2 text-sm">
              My Votes
            </Label>
          </div>

          <Button className="ml-2">Submit Votes</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Pool</TableHead>
              <TableHead>Maturity</TableHead>
              <TableHead className="text-right">Community Vote</TableHead>
              <TableHead className="text-right">Voter APR</TableHead>
              <TableHead className="text-right">7d Fees</TableHead>
              <TableHead className="text-right">Proj. Community Vote</TableHead>
              <TableHead className="text-right">Proj. Voter APR</TableHead>
              <TableHead className="text-right w-[200px]">My Vote</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPools.map((pool) => (
              <TableRow key={pool.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="mr-2 text-2xl">{pool.icon}</div>
                    <div>
                      <div className="font-medium flex items-center">
                        {pool.name}
                        {pool.isNew && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{pool.protocol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                    <span>{pool.maturity}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div>{pool.communityVote}</div>
                  <div className="text-xs text-muted-foreground">{pool.communityVoteAmount} veGTX</div>
                </TableCell>
                <TableCell className="text-right">{pool.voterAPR}</TableCell>
                <TableCell className="text-right">{pool.sevenDayFees}</TableCell>
                <TableCell className="text-right">
                  <div>{pool.projCommunityVote}</div>
                  <div className="text-xs text-muted-foreground">{pool.projCommunityVoteAmount} veGTX</div>
                </TableCell>
                <TableCell className="text-right">{pool.projVoterAPR}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">{pool.myVote}</span>
                    <span className="text-xs text-muted-foreground">{pool.myVoteAmount} veGTX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={pool.myVotePercentage} className="h-2 flex-1" />
                    <Input
                      type="number"
                      className="w-16 h-7 text-xs p-1 text-right"
                      placeholder="0%"
                      defaultValue={pool.myVotePercentage > 0 ? pool.myVotePercentage : ""}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredPools.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No pools match your search criteria</p>
        </div>
      )}
    </div>
  )
}
