import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { OracleSource } from '@/hooks/web3/gtx/perpetual/useOracleServiceManager';
import { PlusCircle, Hexagon, Database, X } from 'lucide-react';

// Data source options
const DATA_SOURCES = [
  'geckoterminal',
  'dexscreener',
  'binance',
  'okx',
  'coinbase',
  'kucoin'
];

interface OracleSourcesProps {
  sources: OracleSource[];
  setSources: (sources: OracleSource[]) => void;
}

const OracleSources: React.FC<OracleSourcesProps> = ({ sources, setSources }) => {
  // Handle source operations
  const handleAddSource = () => {
    setSources([...sources, { name: 'binance', identifier: '', network: '' }]);
  };
  
  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };
  
  const handleUpdateSource = (index: number, field: keyof OracleSource, value: string) => {
    const newSources = [...sources];
    newSources[index] = { ...newSources[index], [field]: value };
    setSources(newSources);
  };

  return (
    <Accordion type="single" collapsible className="w-full bg-slate-900/20 rounded-md border border-blue-500/15">
      <AccordionItem value="sources" className="border-b-0">
        <AccordionTrigger className="text-sm font-medium text-cyan-100 px-4 py-3 hover:bg-cyan-500/5 transition-colors">
          <div className="flex items-center">
            <div className="relative mr-2">
              <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
              <Database className="w-5 h-5 text-cyan-400/60 relative z-10" />
            </div>
            Oracle Sources Configuration
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-2 pb-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-gray-300">Data Sources</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddSource}
                className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/50"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Source
              </Button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {sources.map((source, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start bg-slate-900/30 rounded-md p-2 border border-blue-500/10">
                  <div className="col-span-3">
                    <Select 
                      value={source.name} 
                      onValueChange={(value) => handleUpdateSource(index, 'name', value)}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/95 border-white/10">
                        {DATA_SOURCES.map(src => (
                          <SelectItem 
                            key={src} 
                            value={src} 
                            className="hover:bg-cyan-500/10 focus:bg-cyan-500/10 focus:text-cyan-400"
                          >
                            {src}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-5">
                    <Input 
                      value={source.identifier} 
                      onChange={(e) => handleUpdateSource(index, 'identifier', e.target.value)} 
                      placeholder="Identifier"
                      className="bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <Input 
                      value={source.network} 
                      onChange={(e) => handleUpdateSource(index, 'network', e.target.value)} 
                      placeholder="Network"
                      className="bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                    />
                  </div>
                  
                  <div className="col-span-1 flex justify-center items-center">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveSource(index)}
                      disabled={sources.length <= 1}
                      className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-900/30 rounded-md p-3 border border-cyan-500/10">
              <p className="text-xs text-cyan-100/60">
                <span className="font-medium text-cyan-400">Note:</span> Configure multiple oracle sources for more reliable price feeds. Each source requires a valid identifier and network.
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default OracleSources;