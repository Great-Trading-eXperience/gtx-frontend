'use client';
import React, { useState, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table/table';
import { ChevronLeft, ChevronRight, Star, ArrowUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/_components/ui/button';

interface MarketData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  poolId: string;
  baseDecimals: number;
  quoteDecimals: number;
  volume: string;
  volumeInQuote: string;
  latestPrice: string;
  starred?: boolean;
}

interface DataTableProps {
  data?: MarketData[];
  onRowClick?: (poolId: string) => void;
  showWatchlist?: boolean;
  loading?: boolean;
}

export default function DataTable({
  data = [],
  onRowClick,
  showWatchlist = false,
  loading = false,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [starredMap, setStarredMap] = useState<Record<string, boolean>>({});

  // toggle star
  const toggleStarred = (poolId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredMap(prev => ({
      ...prev,
      [poolId]: !prev[poolId],
    }));
  };

  // derived markets = data + starred status
  const markets = useMemo(() => {
    return (data || []).map(item => ({
      ...item,
      starred: starredMap[item.poolId] ?? false,
    }));
  }, [data, starredMap]);

  // Format volume for display
  const formatVolume = (volume: string, decimals: number) => {
    if (volume === '0') return '0';
    const num = parseFloat(volume) / Math.pow(10, decimals);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  // Format price for display
  const formatPrice = (price: string, decimals: number) => {
    if (price === '0') return '0.00';
    const num = parseFloat(price) / Math.pow(10, decimals);
    return num.toFixed(6);
  };

  // Define columns
  const columns: ColumnDef<MarketData & { starred: boolean }>[] = [
    {
      id: 'star',
      header: '',
      cell: ({ row }) => {
        const market = row.original;
        return (
          <div className="flex justify-center">
            <button
              onClick={e => toggleStarred(market.poolId, e)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Star
                className={`h-4 w-4 ${
                  market.starred
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              />
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'symbol',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-white/80 hover:text-white p-0 h-auto font-semibold"
        >
          Market
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const market = row.original;
        return (
          <div className="font-medium">
            <div className="text-white">
              {market.baseAsset}/{market.quoteAsset}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'latestPrice',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-white/80 hover:text-white p-0 h-auto font-semibold"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const market = row.original;
        const price = formatPrice(market.latestPrice, market.quoteDecimals);
        return <div className="text-white font-mono">${price}</div>;
      },
    },
    {
      accessorKey: 'volume',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-white/80 hover:text-white p-0 h-auto font-semibold"
        >
          24h Volume
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const market = row.original;
        const volume = formatVolume(market.volume, market.baseDecimals);
        const volumeInQuote = formatVolume(market.volumeInQuote, market.quoteDecimals);
        return <div className="text-white/80 font-mono">${volume}</div>;
      },
    },
  ];

  // Filter data based on search term and watchlist
  const filteredData = useMemo(() => {
    // Ensure markets is always an array
    const safeMarkets = Array.isArray(markets) ? markets : [];
    let filtered = safeMarkets;

    // Apply watchlist filter
    if (showWatchlist) {
      filtered = filtered.filter(item => item.starred);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        item =>
          item.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.baseAsset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.quoteAsset?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [markets, searchTerm, showWatchlist]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const renderPaginationButtons = () => {
    const currentPage = table.getState().pagination.pageIndex + 1;
    const totalPages = table.getPageCount();

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => (
        <Button
          key={index}
          variant={currentPage === index + 1 ? 'default' : 'outline'}
          size="sm"
          onClick={() => table.setPageIndex(index)}
          className="text-white border-white/20 hover:bg-white/10"
        >
          {index + 1}
        </Button>
      ));
    } else {
      let start = currentPage - 2;
      let end = currentPage + 2;

      if (start < 1) {
        start = 1;
        end = 5;
      } else if (end > totalPages) {
        start = totalPages - 4;
        end = totalPages;
      }

      const visiblePages = Array.from(
        { length: end - start + 1 },
        (_, index) => start + index
      );

      return visiblePages.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => table.setPageIndex(page - 1)}
          className="text-white border-white/20 hover:bg-white/10"
        >
          {page}
        </Button>
      ));
    }
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
          <Input
            placeholder="Search markets..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/50 border-white/20 text-white focus:ring-white/40 focus:border-white/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-white/10">
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id} className="text-white/80">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className="border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => onRowClick?.(row.original.poolId)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="text-white/80">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-white/60"
                >
                  {loading
                    ? 'Loading markets...'
                    : searchTerm
                    ? `No markets found matching "${searchTerm}"`
                    : showWatchlist
                    ? 'No markets in watchlist. Click the star icon to add markets.'
                    : 'No markets available.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="flex items-center space-x-2 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {renderPaginationButtons()}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-white/60 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
        </div>
      )}
    </div>
  );
}
