"use client"

import { useState } from "react"
import { ArrowRight, ChevronRight, Coins, Lock, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays } from "date-fns"
import { LineChartComponent } from "@/components/vegtx/chart/chart"

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState("1m")

  // Mock data - replace with actual data from your contract
  const userStats = {
    gtxLocked: "532.67",
    veGtxBalance: "498.35",
    lockExpiry: "May 27, 2026",
    lockDuration: 208, // weeks
    maxLockWeeks: 208, // 4 years
    boostMultiplier: "2.4x",
    votingPower: "0.006%", // % of total
    totalVeGtx: "8,234,567",
  }

  const rewardsData = {
    pendingRewards: "12.45",
    rewardsValue: "$245.67",
    lastClaim: "Apr 15, 2025",
    estimatedApr: "24.6%",
    rewardsHistory: [
      { date: "Apr 2025", amount: "12.45", value: "$245.67" },
      { date: "Mar 2025", amount: "10.32", value: "$198.45" },
      { date: "Feb 2025", amount: "11.78", value: "$223.82" },
    ],
  }

  const votingData = {
    allocatedPower: "100%",
    pools: [{ name: "GTX-ETH", allocation: "100%", rewards: "0.0387 ETH", apr: "26.54%" }],
    epochEndsIn: { days: 3, hours: 20, minutes: 7, seconds: 47 },
  }

  const protocolStats = {
    totalGtxLocked: "12,456,789",
    totalVeGtx: "8,234,567",
    averageLockTime: "2.3 years",
    aprRange: "12% - 36%",
  }

  // Chart data
  const veGtxChartData = [
    { name: "Jan", value: 320 },
    { name: "Feb", value: 350 },
    { name: "Mar", value: 400 },
    { name: "Apr", value: 498 },
  ]

  const rewardsChartData = [
    { name: "Jan", value: 8.2 },
    { name: "Feb", value: 9.5 },
    { name: "Mar", value: 10.3 },
    { name: "Apr", value: 12.4 },
  ]

  const formatNumber = (num: string) => {
    return num
  }

  const calculateLockProgress = () => {
    return (userStats.lockDuration / userStats.maxLockWeeks) * 100
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your veGTX position, rewards, and voting power</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" asChild>
            <a href="/vetoken/lock/update">Manage Lock</a>
          </Button>
          <Button asChild>
            <a href="/vetoken/vote">Vote</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>GTX Locked</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              {userStats.gtxLocked}
              <Badge variant="outline" className="ml-2">
                GTX
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Lock Expiry</span>
              <span>{userStats.lockExpiry}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>veGTX Balance</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              {userStats.veGtxBalance}
              <Badge variant="outline" className="ml-2">
                veGTX
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Boost Multiplier</span>
              <span>{userStats.boostMultiplier}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Rewards</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              {rewardsData.pendingRewards}
              <Badge variant="outline" className="ml-2">
                GTX
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Value</span>
              <span>{rewardsData.rewardsValue}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Voting Power</CardDescription>
            <CardTitle className="text-2xl">{userStats.votingPower}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Allocation</span>
              <span>{votingData.allocatedPower}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>veGTX Position</CardTitle>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1w">1W</SelectItem>
                  <SelectItem value="1m">1M</SelectItem>
                  <SelectItem value="3m">3M</SelectItem>
                  <SelectItem value="1y">1Y</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <LineChartComponent data={veGtxChartData} xAxisKey="name" yAxisKey="value" className="h-full" />
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Lock Duration</p>
              <div className="mt-1">
                <Progress value={calculateLockProgress()} className="h-2 w-[200px]" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/vetoken/lock/update">
                Extend Lock <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lock Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">GTX Locked</span>
                <span>{userStats.gtxLocked} GTX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">veGTX Balance</span>
                <span>{userStats.veGtxBalance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lock Expiry</span>
                <span>{userStats.lockExpiry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Boost Multiplier</span>
                <span>{userStats.boostMultiplier}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Voting Power</span>
                <span>{userStats.votingPower}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total veGTX</span>
                <span>{userStats.totalVeGtx}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button className="w-full" asChild>
                <a href="/vetoken/lock/update">Manage Lock</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Pending Rewards</p>
                <p className="text-xl font-bold mt-1">{rewardsData.pendingRewards} GTX</p>
                <p className="text-sm text-muted-foreground">{rewardsData.rewardsValue}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Last Claim</p>
                <p className="text-xl font-bold mt-1">{rewardsData.lastClaim}</p>
                <p className="text-sm text-muted-foreground">10.32 GTX</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Estimated APR</p>
                <p className="text-xl font-bold mt-1">{rewardsData.estimatedApr}</p>
                <p className="text-sm text-muted-foreground">Based on current votes</p>
              </div>
            </div>

            <div className="h-[200px]">
              <LineChartComponent data={rewardsChartData} xAxisKey="name" yAxisKey="value" className="h-full" />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewardsData.rewardsHistory.map((reward, index) => (
                  <TableRow key={index}>
                    <TableCell>{reward.date}</TableCell>
                    <TableCell>{reward.amount} GTX</TableCell>
                    <TableCell>{reward.value}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button className="w-full">Claim Rewards</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voting Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Epoch Ends In</span>
              </div>
              <div className="font-mono text-lg">
                {votingData.epochEndsIn.days}d {votingData.epochEndsIn.hours}h {votingData.epochEndsIn.minutes}m{" "}
                {votingData.epochEndsIn.seconds}s
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Your Votes</h4>
              {votingData.pools.map((pool, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{pool.name}</span>
                    <Badge>{pool.allocation}</Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Rewards</span>
                    <span>{pool.rewards}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>APR</span>
                    <span>{pool.apr}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button className="w-full" asChild>
                <a href="/vetoken/vote">Manage Votes</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Protocol Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total GTX Locked</p>
                <p className="text-xl font-bold">{protocolStats.totalGtxLocked}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total veGTX</p>
                <p className="text-xl font-bold">{protocolStats.totalVeGtx}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Average Lock Time</p>
                <p className="text-xl font-bold">{protocolStats.averageLockTime}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">APR Range</p>
                <p className="text-xl font-bold">{protocolStats.aprRange}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {i === 1 && <Coins className="h-4 w-4 text-primary" />}
                    {i === 2 && <Lock className="h-4 w-4 text-primary" />}
                    {i === 3 && <Wallet className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {i === 1 && "Rewards Claimed"}
                      {i === 2 && "Lock Extended"}
                      {i === 3 && "Votes Updated"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i === 1 && "You claimed 10.32 GTX rewards"}
                      {i === 2 && "Lock extended to May 27, 2026"}
                      {i === 3 && "Updated vote allocation to GTX-ETH pool"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">{format(addDays(new Date(), -i), "MMM d, yyyy")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
