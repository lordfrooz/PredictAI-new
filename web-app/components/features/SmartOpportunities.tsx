'use client';

import React, { useState, useEffect } from 'react';

/**
 * Smart Opportunities Dashboard
 * 
 * Displays:
 * - Top trading opportunities across all markets
 * - Edge quality indicators
 * - Kelly criterion recommendations
 * - Contrarian alerts
 */

interface OpportunityData {
  marketTitle: string;
  optionName: string;
  marketProbability: number;
  aiProbability: number;
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  opportunityScore: number;
  edge: {
    raw: number;
    adjusted: number;
    quality: 'strong' | 'moderate' | 'weak' | 'none';
  };
  kelly: {
    recommendation: 'strong_bet' | 'moderate_bet' | 'small_bet' | 'no_bet';
    maxRiskPercent: number;
  };
  efficiency: {
    score: number;
    category: 'inefficient' | 'semi-efficient' | 'efficient';
    exploitability: 'high' | 'medium' | 'low' | 'none';
  };
  signalAgreement: number;
  isContrarian: boolean;
  warnings: string[];
  confidence: 'low' | 'medium' | 'high';
  eventType: string;
}

interface SmartOpportunitiesProps {
  opportunities?: OpportunityData[];
  isLoading?: boolean;
}

// Action badge colors
const actionColors: Record<string, { bg: string; text: string; border: string }> = {
  strong_buy: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  buy: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  hold: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/50' },
  sell: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  strong_sell: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' }
};

// Edge quality icons
const edgeQualityIcons: Record<string, string> = {
  strong: '??',
  moderate: '?',
  weak: '??',
  none: '?'
};

// Kelly recommendation labels
const kellyLabels: Record<string, string> = {
  strong_bet: 'Strong Position',
  moderate_bet: 'Moderate Position',
  small_bet: 'Small Position',
  no_bet: 'No Position'
};

export function SmartOpportunities({ opportunities = [], isLoading = false }: SmartOpportunitiesProps) {
  // Sort by opportunity score
  const sortedOpps = [...opportunities].sort((a, b) => b.opportunityScore - a.opportunityScore);
  
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-lg">??</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Smart Opportunities</h3>
            <p className="text-sm text-zinc-500">Finding edges...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-xl bg-zinc-800/50 h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (sortedOpps.length === 0) {
    return (
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-lg">??</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Smart Opportunities</h3>
            <p className="text-sm text-zinc-500">No significant edges found</p>
          </div>
        </div>
        <div className="text-center py-8 text-zinc-500">
          <p>Markets appear efficiently priced right now.</p>
          <p className="text-sm mt-2">Check back later for new opportunities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-lg">??</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Smart Opportunities</h3>
            <p className="text-sm text-zinc-500">
              {sortedOpps.length} opportunities detected
            </p>
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          Sorted by opportunity score
        </div>
      </div>

      {/* Opportunity Cards */}
      <div className="space-y-4">
        {sortedOpps.slice(0, 5).map((opp, index) => (
          <OpportunityCard 
            key={`${opp.marketTitle}-${opp.optionName}`} 
            opportunity={opp} 
            rank={index + 1}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-zinc-800">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-amber-400">
              {sortedOpps.filter(o => o.action.includes('buy')).length}
            </div>
            <div className="text-xs text-zinc-500">Buy Signals</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {sortedOpps.filter(o => o.action.includes('sell')).length}
            </div>
            <div className="text-xs text-zinc-500">Sell Signals</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {sortedOpps.filter(o => o.isContrarian).length}
            </div>
            <div className="text-xs text-zinc-500">Contrarian</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity: opp, rank }: { opportunity: OpportunityData; rank: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const actionStyle = actionColors[opp.action] || actionColors.hold;

  // Opportunity score color
  const scoreColor = opp.opportunityScore >= 70 ? 'text-emerald-400' :
                     opp.opportunityScore >= 50 ? 'text-amber-400' :
                     opp.opportunityScore >= 30 ? 'text-orange-400' : 'text-zinc-400';

  return (
    <div 
      className={`rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden transition-all
        ${opp.opportunityScore >= 70 ? 'ring-1 ring-amber-500/30' : ''}`}
    >
      {/* Main Row */}
      <div 
        className="p-4 cursor-pointer hover:bg-zinc-800/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          {/* Left side */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Rank */}
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                {rank}
              </span>
              {/* Edge Quality Icon */}
              <span title={`Edge: ${opp.edge.quality}`}>
                {edgeQualityIcons[opp.edge.quality]}
              </span>
              {/* Contrarian Badge */}
              {opp.isContrarian && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30">
                  Contrarian
                </span>
              )}
            </div>
            
            {/* Market Title */}
            <h4 className="font-medium text-white truncate mb-1">
              {opp.optionName}
            </h4>
            <p className="text-xs text-zinc-500 truncate">
              {opp.marketTitle}
            </p>
          </div>

          {/* Right side - Action & Score */}
          <div className="flex flex-col items-end gap-2 ml-4">
            {/* Action Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}>
              {opp.action.replace('_', ' ').toUpperCase()}
            </span>
            
            {/* Opportunity Score */}
            <div className="text-right">
              <div className={`text-lg font-bold ${scoreColor}`}>
                {opp.opportunityScore}
              </div>
              <div className="text-xs text-zinc-500">Score</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div>
            <span className="text-zinc-500">Market: </span>
            <span className="text-white">{opp.marketProbability}%</span>
          </div>
          <div>
            <span className="text-zinc-500">AI: </span>
            <span className="text-white">{opp.aiProbability}%</span>
          </div>
          <div>
            <span className="text-zinc-500">Edge: </span>
            <span className={opp.edge.adjusted > 0 ? 'text-emerald-400' : 'text-red-400'}>
              {opp.edge.adjusted > 0 ? '+' : ''}{opp.edge.adjusted.toFixed(1)}pts
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Confidence: </span>
            <span className={
              opp.confidence === 'high' ? 'text-emerald-400' :
              opp.confidence === 'medium' ? 'text-amber-400' : 'text-zinc-400'
            }>
              {opp.confidence}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-zinc-700/50">
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Kelly Criterion */}
            <div className="rounded-lg bg-zinc-900/50 p-3">
              <div className="text-xs text-zinc-500 mb-1">Position Sizing (Kelly)</div>
              <div className="text-sm font-medium text-white">
                {kellyLabels[opp.kelly.recommendation]}
              </div>
              <div className="text-xs text-zinc-400">
                Max risk: {opp.kelly.maxRiskPercent}% of bankroll
              </div>
            </div>

            {/* Market Efficiency */}
            <div className="rounded-lg bg-zinc-900/50 p-3">
              <div className="text-xs text-zinc-500 mb-1">Market Efficiency</div>
              <div className="text-sm font-medium text-white capitalize">
                {opp.efficiency.category}
              </div>
              <div className="text-xs text-zinc-400">
                Exploitability: {opp.efficiency.exploitability}
              </div>
            </div>

            {/* Signal Agreement */}
            <div className="rounded-lg bg-zinc-900/50 p-3">
              <div className="text-xs text-zinc-500 mb-1">Signal Agreement</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      opp.signalAgreement > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.abs(opp.signalAgreement)}%`,
                      marginLeft: opp.signalAgreement < 0 ? 'auto' : 0
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-white">
                  {opp.signalAgreement > 0 ? '+' : ''}{opp.signalAgreement}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {opp.signalAgreement > 30 ? 'Strong bullish alignment' :
                 opp.signalAgreement < -30 ? 'Strong bearish alignment' :
                 'Mixed signals'}
              </div>
            </div>

            {/* Event Type */}
            <div className="rounded-lg bg-zinc-900/50 p-3">
              <div className="text-xs text-zinc-500 mb-1">Category</div>
              <div className="text-sm font-medium text-white capitalize">
                {opp.eventType}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {opp.warnings.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-400 font-medium mb-1">?? Warnings</div>
              <ul className="text-xs text-amber-300/80 space-y-1">
                {opp.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SmartOpportunities;
