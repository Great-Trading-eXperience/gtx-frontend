"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DotPattern } from "../magicui/dot-pattern"

const PoolCreationSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Dot pattern background */}
      <DotPattern />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="space-y-6 w-full max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="h-10 w-40 bg-gray-800 rounded-md animate-pulse"></div>
          </div>

          {/* Single column layout */}
          <div className="w-full">
            <Card className="bg-[#121212] border-white/10">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Title Skeleton */}
                  <div>
                    <div className="h-8 w-48 bg-gray-800 rounded-md animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-800 rounded-md animate-pulse"></div>
                  </div>

                  {/* Token Selection Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="w-full h-14 bg-[#0A0A0A] border border-white/20 rounded-md px-4 flex items-center justify-between animate-pulse">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                          <div className="w-20 h-4 bg-gray-700 rounded ml-2"></div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>

                    <div>
                      <div className="w-full h-14 bg-[#0A0A0A] border border-white/20 rounded-md px-4 flex items-center justify-between animate-pulse">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                          <div className="w-20 h-4 bg-gray-700 rounded ml-2"></div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  </div>

                  {/* Fee Tier Section Skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                    <div className="w-40 h-4 bg-gray-800 rounded-md animate-pulse"></div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="h-7 w-32 bg-gray-800 rounded-md animate-pulse mb-2"></div>
                      <div className="h-4 w-full bg-gray-800 rounded-md animate-pulse"></div>
                    </div>

                    {/* Fee Tier Box Skeleton */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="h-6 w-36 bg-gray-700 rounded-md animate-pulse mb-2"></div>
                          <div className="h-4 w-48 bg-gray-700 rounded-md animate-pulse"></div>
                        </div>
                        <div className="w-20 h-8 bg-gray-700 rounded-md animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Button Skeleton */}
                  <div className="w-full h-14 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PoolCreationSkeleton