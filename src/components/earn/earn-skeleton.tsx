import { DotPattern } from "@/components/magicui/dot-pattern"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const EarnSkeleton = () => {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <DotPattern />
      <main className="relative z-10 flex-1 flex items-center justify-start p-8">
        <div className="space-y-8 w-full max-w-7xl mx-auto">
          <div className="text-start space-y-4">
            <Skeleton className="h-10 w-40 bg-gray-800" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-64 bg-gray-800" />
              <Skeleton className="h-6 w-96 bg-gray-800" />
            </div>
          </div>

          <div className="w-full bg-[#121212] backdrop-blur-sm rounded-xl border border-blue-500/20 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.05)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-blue-500/20">
                  <TableHead className="text-blue-300 font-medium">Asset</TableHead>
                  <TableHead className="text-blue-300 font-medium">Vault</TableHead>
                  <TableHead className="text-blue-300 font-medium">Curator</TableHead>
                  <TableHead className="text-blue-300 font-medium">Market</TableHead>
                  <TableHead className="text-right text-blue-300 font-medium">APY</TableHead>
                  <TableHead className="text-right text-blue-300 font-medium">TVL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-blue-500/10">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full bg-gray-800" />
                        <Skeleton className="h-4 w-16 bg-gray-800" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 bg-gray-800" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 bg-gray-800" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32 bg-gray-800" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 bg-gray-800 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 bg-gray-800 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Skeleton className="w-10 h-10 rounded-full bg-gray-800" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-8 rounded-lg bg-gray-800" />
              <Skeleton className="h-4 w-12 bg-gray-800" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full bg-gray-800" />
          </div>
        </div>
      </main>
    </div>
  )
}