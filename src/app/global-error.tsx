'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-black relative overflow-hidden">
          {/* Main Content */}
          <main className="relative z-10 container mx-auto px-6 py-12 min-h-screen flex items-center justify-center">
            <Card className="border-0 bg-[#121212] backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(239,68,68,0.03)] border border-white/20">
              <CardContent className="p-12 text-center">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-red-500/10 blur-[24px] rounded-full"></div>
                  <AlertTriangle className="w-16 h-16 text-red-500 relative z-10" />
                </div>
                
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-4">
                  Something went wrong!
                </h1>
                
                <p className="text-white/80 mb-8">
                  An unexpected error occurred. Please try again or contact support if the problem persists.
                </p>
                
                {error.digest && (
                  <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">
                      Error ID: {error.digest}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => reset()}
                  className="w-full rounded-md bg-gradient-to-r hover:from-red-500 hover:to-red-600 from-red-600 to-red-700 text-white h-12 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </body>
    </html>
  )
}