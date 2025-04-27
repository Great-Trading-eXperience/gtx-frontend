"use client"

import { useState } from "react"
import { Calendar, CalendarIcon, Coins, Info, Lock, Plus, Unlock } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DateTime } from "luxon"

export default function VeTokenLockPage() {
    const [lockAmount, setLockAmount] = useState("")
    const [lockDuration, setLockDuration] = useState(52) // weeks
    const [activeTab, setActiveTab] = useState("lock")
    const [lockAction, setLockAction] = useState("new")
    const [date, setDate] = useState<DateTime>(DateTime.now().plus({ years: 1 }))

    // Mock data - replace with actual data from your contract
    const tokenSymbol = "GTX"
    const maxLockWeeks = 208 // 4 years
    const userBalance = "1,245.32"
    const currentlyLocked = "532.67"
    const lockExpiry = "May 27, 2026"
    const veTokenBalance = "498.35"
    const boostMultiplier = "2.4x"
    const hasExistingLock = true // Set to false if user has no lock

    const calculateVeTokenAmount = () => {
        if (!lockAmount) return "0"
        // Simple calculation for demo purposes
        // In reality, this would be based on your tokenomics formula
        const amount = Number.parseFloat(lockAmount.replace(/,/g, ""))
        const ratio = lockDuration / maxLockWeeks
        return (amount * ratio).toFixed(2)
    }

    const handleMaxAmount = () => {
        setLockAmount(userBalance)
    }

    const handlePeriodSelect = (weeks: number) => {
        setLockDuration(weeks)
        setDate(DateTime.now().plus({ weeks }))
    }

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const luxonDate = DateTime.fromJSDate(selectedDate)
            setDate(luxonDate)
            // Calculate weeks between now and selected date
            const now = DateTime.now()
            const diffWeeks = Math.ceil(luxonDate.diff(now, 'weeks').weeks)
            setLockDuration(Math.min(Math.max(diffWeeks, 1), maxLockWeeks))
        }
    }

    const formatDuration = (weeks: number) => {
        if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"}`
        if (weeks < 52) return `${Math.floor(weeks / 4)} month${Math.floor(weeks / 4) === 1 ? "" : "s"}`
        const years = Math.floor(weeks / 52)
        const remainingWeeks = weeks % 52
        if (remainingWeeks === 0) return `${years} year${years === 1 ? "" : "s"}`
        return `${years} year${years === 1 ? "" : "s"}, ${remainingWeeks} week${remainingWeeks === 1 ? "" : "s"}`
    }

    const renderLockForm = () => {
        switch (lockAction) {
            case "new":
                return (
                    <>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Amount to Lock</Label>
                                <span className="text-sm text-muted-foreground">
                                    Balance: {userBalance} {tokenSymbol}
                                </span>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <img src="/logo/gtx.png" className="h-4 w-4" />
                                </div>
                                <Input
                                    value={lockAmount}
                                    onChange={(e) => setLockAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-9 pr-16 rounded-xl h-12"
                                />
                                <div className="absolute inset-y-2 right-2 flex items-center">
                                    <Button
                                        onClick={handleMaxAmount}
                                        className="h-full text-xs font-medium px-3 hover:bg-transparent hover:text-primary"
                                    >
                                        MAX
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mt-6">
                            <div className="flex justify-between">
                                <Label>Lock Duration</Label>
                                <span className="text-sm font-medium">{formatDuration(lockDuration)}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <Button
                                    variant={lockDuration === 52 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePeriodSelect(52)}
                                >
                                    1Y
                                </Button>
                                <Button
                                    variant={lockDuration === 104 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePeriodSelect(104)}
                                >
                                    2Y
                                </Button>
                                <Button
                                    variant={lockDuration === 208 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePeriodSelect(208)}
                                >
                                    4Y
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <CalendarIcon className="h-4 w-4 mr-1" />
                                            <span>Custom</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <CalendarComponent
                                            mode="single"
                                            selected={date.toJSDate()}
                                            onSelect={handleDateSelect}
                                            disabled={(calDate) => {
                                                const now = DateTime.now()
                                                const dateTime = DateTime.fromJSDate(calDate)
                                                return dateTime < now || dateTime > now.plus({ years: 4 })
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="p-4 bg-muted rounded-lg space-y-2 mt-4">
                            <div className="flex justify-between">
                                <span className="text-sm">You will receive</span>
                                <span className="font-medium">
                                    {calculateVeTokenAmount()} ve{tokenSymbol}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Lock expires on</span>
                                <span className="font-medium">{date ? date.toFormat("MMM d, yyyy") : "Select a date"}</span>
                            </div>
                        </div>
                    </>
                )
            case "increase":
                return (
                    <>
                        <div className="p-4 bg-muted rounded-lg space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span className="text-sm">Currently locked</span>
                                <span className="font-medium">
                                    {currentlyLocked} {tokenSymbol}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Lock expires on</span>
                                <span className="font-medium">{lockExpiry}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Additional amount</Label>
                                <span className="text-sm text-muted-foreground">
                                    Balance: {userBalance} {tokenSymbol}
                                </span>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <img src="/logo/gtx.png" className="h-4 w-4" />
                                </div>
                                <Input
                                    value={lockAmount}
                                    onChange={(e) => setLockAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-9 pr-16 rounded-xl h-12"
                                />
                                <div className="absolute inset-y-2 right-2 flex items-center">
                                    <Button
                                        onClick={handleMaxAmount}
                                        className="h-full text-xs font-medium px-3 hover:bg-transparent hover:text-primary"
                                    >
                                        MAX
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-muted rounded-lg space-y-2 mt-4">
                            <div className="flex justify-between">
                                <span className="text-sm">New locked amount</span>
                                <span className="font-medium">
                                    {lockAmount
                                        ? (
                                            Number.parseFloat(currentlyLocked.replace(/,/g, "")) +
                                            Number.parseFloat(lockAmount.replace(/,/g, ""))
                                        ).toFixed(2)
                                        : currentlyLocked}{" "}
                                    {tokenSymbol}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Estimated ve{tokenSymbol}</span>
                                <span className="font-medium">
                                    {lockAmount
                                        ? (
                                            Number.parseFloat(veTokenBalance.replace(/,/g, "")) +
                                            Number.parseFloat(calculateVeTokenAmount())
                                        ).toFixed(2)
                                        : veTokenBalance}
                                </span>
                            </div>
                        </div>
                    </>
                )
            case "extend":
                return (
                    <>
                        <div className="p-4 bg-muted rounded-lg space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span className="text-sm">Currently locked</span>
                                <span className="font-medium">
                                    {currentlyLocked} {tokenSymbol}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Current lock expiry</span>
                                <span className="font-medium">{lockExpiry}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>New Lock Duration</Label>
                                <span className="text-sm font-medium">{formatDuration(lockDuration)}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <Button
                                    variant={lockDuration === 52 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePeriodSelect(52)}
                                >
                                    1Y
                                </Button>
                                <Button
                                    variant={lockDuration === 104 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePeriodSelect(104)}
                                >
                                    2Y
                                </Button>
                                <Button
                                    variant={lockDuration === 208 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePeriodSelect(208)}
                                >
                                    4Y
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <CalendarIcon className="h-4 w-4 mr-1" />
                                            <span>Custom</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <CalendarComponent
                                            mode="single"
                                            selected={date.toJSDate()}
                                            onSelect={handleDateSelect}
                                            disabled={(calDate) => {
                                                const now = DateTime.now()
                                                const dateTime = DateTime.fromJSDate(calDate)
                                                return dateTime < now || dateTime > now.plus({ years: 4 })
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="p-4 bg-muted rounded-lg space-y-2 mt-4">
                            <div className="flex justify-between">
                                <span className="text-sm">New lock expiry</span>
                                <span className="font-medium">{date ? date.toFormat("MMM d, yyyy") : "Select a date"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Estimated ve{tokenSymbol}</span>
                                <span className="font-medium">
                                    {((Number.parseFloat(veTokenBalance.replace(/,/g, "")) * (lockDuration / 52)) / 2).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </>
                )
            default:
                return null
        }
    }

    const getLockButtonText = () => {
        switch (lockAction) {
            case "new":
                return `Lock ${tokenSymbol}`
            case "increase":
                return "Increase Lock Amount"
            case "extend":
                return "Extend Lock Duration"
            default:
                return "Submit"
        }
    }

    return (
        <div className="container max-w-6xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">ve{tokenSymbol} Lock</h1>
                <p className="text-muted-foreground">
                    Lock your {tokenSymbol} tokens to receive ve{tokenSymbol} and boost your rewards
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 mb-6 rounded-xl">
                            <TabsTrigger value="lock">Lock</TabsTrigger>
                            <TabsTrigger value="redeem">Redeem</TabsTrigger>
                        </TabsList>

                        <TabsContent value="lock">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Lock className="mr-2 h-5 w-5" />
                                        {hasExistingLock ? "Manage Lock" : "Lock GTX"}
                                    </CardTitle>
                                    <CardDescription>
                                        {hasExistingLock
                                            ? "Manage your existing lock by increasing amount or extending duration"
                                            : "Lock your GTX tokens to receive veGTX and boost your rewards"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {hasExistingLock && (
                                        <RadioGroup
                                            value={lockAction}
                                            onValueChange={setLockAction}
                                            className="grid grid-cols-3 gap-4 mb-4"
                                        >
                                            <div>
                                                <RadioGroupItem value="new" id="new" className="peer sr-only" />
                                                <Label
                                                    htmlFor="new"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                                >
                                                    <Lock className="mb-2 h-5 w-5" />
                                                    <span className="text-sm font-medium">New Lock</span>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="increase" id="increase" className="peer sr-only" />
                                                <Label
                                                    htmlFor="increase"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                                >
                                                    <Plus className="mb-2 h-5 w-5" />
                                                    <span className="text-sm font-medium">Increase</span>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="extend" id="extend" className="peer sr-only" />
                                                <Label
                                                    htmlFor="extend"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                                >
                                                    <Calendar className="mb-2 h-5 w-5" />
                                                    <span className="text-sm font-medium">Extend</span>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    )}

                                    {renderLockForm()}
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" size="lg">
                                        {getLockButtonText()}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="redeem">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Unlock className="mr-2 h-5 w-5" />
                                        Redeem GTX
                                    </CardTitle>
                                    <CardDescription>Withdraw your locked GTX tokens after the lock period expires</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="p-4 bg-muted rounded-lg space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Locked GTX</span>
                                            <span className="font-medium">{currentlyLocked} GTX</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">veGTX Balance</span>
                                            <span className="font-medium">{veTokenBalance}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Lock Expiry</span>
                                            <span className="font-medium">{lockExpiry}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between">
                                            <span className="text-sm">Status</span>
                                            <span className="font-medium text-amber-500">Locked</span>
                                            {/* Use text-green-500 and "Available to Redeem" when lock has expired */}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium">Time Remaining</h4>
                                        <Progress value={75} className="h-2" />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>0%</span>
                                            <span>75%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col space-y-2">
                                    <Button className="w-full" size="lg" disabled>
                                        Redeem GTX (Available after {lockExpiry})
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Position</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Locked GTX</span>
                                    <span className="font-medium">{currentlyLocked}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>veGTX Balance</span>
                                    <span className="font-medium">{veTokenBalance}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Lock Expiry</span>
                                    <span className="font-medium">{lockExpiry}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="flex items-center">
                                        Boost Multiplier
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="w-[200px] text-xs">
                                                        Your boost multiplier increases your rewards in the protocol based on your veGTX balance.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </span>
                                    <span className="font-medium">{boostMultiplier}</span>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">Lock Duration</h4>
                                <Progress value={(lockDuration / maxLockWeeks) * 100} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0%</span>
                                    <span>{Math.round((lockDuration / maxLockWeeks) * 100)}%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="auto-compound" className="text-sm">
                                        Auto-compound rewards
                                    </Label>
                                    <Switch id="auto-compound" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="auto-extend" className="text-sm">
                                        Auto-extend lock
                                    </Label>
                                    <Switch id="auto-extend" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Protocol Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Total GTX Locked</span>
                                <span className="font-medium">12,456,789</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Total veGTX</span>
                                <span className="font-medium">8,234,567</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Average Lock Time</span>
                                <span className="font-medium">2.3 years</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>APR Range</span>
                                <span className="font-medium">12% - 36%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
