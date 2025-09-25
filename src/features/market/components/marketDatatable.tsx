import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Star, Clock, Copy } from 'lucide-react';

interface MarketData {
  age: string;
  iconInfo: {
    bg: string;
    hasImage: boolean;
    imagePath: string;
  };
  id: string;
  liquidity: string;
  name: string;
  pair: string;
  price: string;
  starred: boolean;
  timestamp: number;
  volume: string;
}

interface MarketsTableProps {
  data: MarketData[] | undefined;
  onRowClick?: (marketId: string) => void;
  showWatchlist?: boolean;
  loading?: boolean;
}

export default function MarketsDataTable({
  data = [],
  onRowClick,
  showWatchlist = false,
  loading = false,
}: MarketsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Initialize starred items from data
  useEffect(() => {
    const initialStarred = new Set(data.filter(item => item.starred).map(item => item.id));
    setStarredItems(initialStarred);
  }, []);

  // Toggle starred status
  const toggleStarred = (marketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(marketId)) {
        newSet.delete(marketId);
      } else {
        newSet.add(marketId);
      }
      return newSet;
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedItem(`${type}-${text}`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  // Parse volume number for sorting
  const parseVolume = (volume: string) => {
    return parseFloat(volume.replace(/,/g, ''));
  };

  // Parse price number for sorting
  const parsePrice = (price: string) => {
    return parseFloat(price.replace(/[,$]/g, ''));
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.map(item => ({
      ...item,
      starred: starredItems.has(item.id)
    }));

    // Apply watchlist filter
    if (showWatchlist) {
      filtered = filtered.filter(item => item.starred);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'timestamp':
          aVal = a.timestamp;
          bVal = b.timestamp;
          break;
        case 'price':
          aVal = parsePrice(a.price);
          bVal = parsePrice(b.price);
          break;
        case 'volume':
          aVal = parseVolume(a.volume);
          bVal = parseVolume(b.volume);
          break;
        case 'liquidity':
          aVal = parseFloat(a.liquidity);
          bVal = parseFloat(b.liquidity);
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'age':
          // Convert age to minutes for sorting
          const getMinutes = (age: string) => {
            const num = parseInt(age);
            if (age.includes('s')) return num / 60;
            if (age.includes('m')) return num;
            if (age.includes('h')) return num * 60;
            if (age.includes('d')) return num * 1440;
            return 0;
          };
          aVal = getMinutes(a.age);
          bVal = getMinutes(b.age);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection, showWatchlist, starredItems]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Render pagination buttons
  const renderPaginationButtons = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          onClick={() => setCurrentPage(index + 1)}
          className={`px-3 py-1 text-sm rounded border transition-colors ${
            currentPage === index + 1
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-white border-white/20 hover:bg-white/10'
          }`}
        >
          {index + 1}
        </button>
      ));
    }

    let start = currentPage - 2;
    let end = currentPage + 2;

    if (start < 1) {
      start = 1;
      end = 5;
    } else if (end > totalPages) {
      start = totalPages - 4;
      end = totalPages;
    }

    return Array.from({ length: end - start + 1 }, (_, index) => {
      const page = start + index;
      return (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`px-3 py-1 text-sm rounded border transition-colors ${
            currentPage === page
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-white border-white/20 hover:bg-white/10'
          }`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="w-full">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Market
                  </th>
                  <th 
                    className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort('age')}
                  >
                    <div className="flex items-center gap-2">
                      Age
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-2">
                      Price
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort('volume')}
                  >
                    <div className="flex items-center gap-2">
                      Volume
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort('liquidity')}
                  >
                    <div className="flex items-center gap-2">
                      Liquidity
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-white/50">
                      Loading markets...
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((market) => (
                    <tr
                      key={market.id}
                      className="hover:bg-white/10 cursor-pointer transition-colors duration-200 border-b border-white/5 last:border-0"
                      onClick={() => onRowClick?.(market.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group">
                            <button
                              className="w-6 h-6 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/20 transition-colors"
                              onClick={(e) => copyToClipboard(market.id, 'market', e)}
                            >
                              <Copy className="h-3 w-3 text-white/70" />
                            </button>
                            <div className="absolute left-0 top-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-white text-xs rounded-md py-1.5 px-2.5 whitespace-nowrap z-10">
                              Copy token {market.name}
                            </div>
                          </div>
                          <button
                            className="text-white/50 hover:text-yellow-400 transition-colors"
                            onClick={(e) => toggleStarred(market.id, e)}
                            aria-label={
                              market.starred ? 'Remove from watchlist' : 'Add to watchlist'
                            }
                          >
                            <Star
                              className={`w-5 h-5 ${
                                market.starred ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'
                              }`}
                            />
                          </button>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-white/30"
                            style={{ backgroundColor: market.iconInfo.bg }}
                          >
                            {market.iconInfo.hasImage && market.iconInfo.imagePath ? (
                              <img
                                src={market.iconInfo.imagePath}
                                alt={market.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="flex items-center justify-center w-full h-full text-white"
                              style={{ 
                                display: market.iconInfo.hasImage && market.iconInfo.imagePath ? 'none' : 'flex',
                                backgroundColor: market.iconInfo.bg 
                              }}
                            >
                              <span className="font-bold text-xs">
                                {market.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">{market.name}</span>
                            <span className="text-white/60">/ {market.pair}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div
                          className="flex items-center gap-2 text-white/80"
                          title={new Date(market.timestamp * 1000).toLocaleString()}
                        >
                          <Clock className="w-4 h-4 text-white/60" />
                          {market.age}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-white font-mono">${market.price}</td>
                      <td className="px-6 py-5 text-white/90 font-mono">
                        ${market.volume}
                      </td>
                      <td className="px-6 py-5 text-white/90 font-mono">
                        ${market.liquidity === "0" ? "0" : parseFloat(market.liquidity).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-white/50">
                      {showWatchlist
                        ? 'Your watchlist is empty. Star some markets to add them here.'
                        : searchTerm
                        ? `No markets found matching "${searchTerm}"`
                        : 'No markets found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="flex items-center space-x-2 py-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded border border-white/20 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {renderPaginationButtons()}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-white/20 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="text-white/60 text-sm">
              Page {currentPage} of {totalPages} ({filteredAndSortedData.length} total markets)
            </div>
          </div>
        )}

        {/* Copy notification */}
        {copiedItem && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Copied to clipboard!
          </div>
        )}
    </div>
  );
}