import Groq from "groq-sdk";
import { 
  calculateNewsScore, 
  calculateMomentumScore, 
  calculateHybridProbability, 
  generateHybridExplanation,
  VectorScores 
} from "./hybridAnalysis";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

// --- Interfaces (Required by route.ts and internal logic) ---

export interface MarketOption {
  option_name: string;
  image?: string | null;
  implied_probability: number;
  volume_share_percent: number;
  price_change_24h: number;
}

export interface SocialData {
  sentiment: number;
  engagement: number;
  trendDirection: 'up' | 'down' | 'stable';
  mentions: number;
}

export interface MarketEvent {
  event_title: string;
  market_image?: string;
  category: string;
  event_type: "sports" | "politics" | "crypto" | "pop" | "other";
  resolution_method: "official result" | "oracle" | "media consensus";
  subjectivity_level: "low" | "medium" | "high";
  time_to_resolution_hours: number;
  options: MarketOption[];
  event_metrics: {
    total_volume: number;
    volume_last_24h: number;
    total_wallets: number;
    whaleData?: { buyWall: number; sellWall: number; largeTrades: number };
  };
  // Optional hybrid data
  newsArticles?: Array<{ title: string; description?: string; sentiment?: number }>;
  socialData?: Record<string, SocialData>;
}

export interface AnalysisOption {
  option: string;
  marketProbability: number;
  aiScore: number;
  pricingLabel: "Underpriced" | "Fairly Priced" | "Overpriced";
  pricingDeviation?: number;
  note: string;
  image?: string | null;
}

export interface SimplifiedAnalysisResult {
  title: string;
  market_image?: string;
  category: string;
  analysis: AnalysisOption[];
  event?: string;
  marketStructure?: string;
}

// --- Main Class ---

export class MarketAnalyst {
  async analyze(event: MarketEvent): Promise<SimplifiedAnalysisResult> {
    try {
      // 1. Prepare Data for LLM
      const optionsData = event.options.map(opt => ({
        name: opt.option_name,
        market_price: Math.round(opt.implied_probability * 100),
        image: opt.image
      }));

      // Type-specific guidance
      const typeGuidelines: Record<string, string> = {
        sports: "Focus on form, injuries, and stats. Ignore hype.",
        politics: "Focus on polling trends and demographics. Ignore partisan noise.",
        crypto: "Focus on on-chain data and macro correlation. High volatility expected.",
        pop: "Focus on social sentiment trends.",
        other: "Focus on base rates and logic."
      };
      const typeGuide = typeGuidelines[event.event_type] || typeGuidelines.other;

      // 2. Construct SEMI-AGGRESSIVE Prompt
      const systemPrompt = `You are PredictlyAI, a SHARP and OPPORTUNISTIC prediction market analyst.
Your goal is to find Alpha and Mispricings, but NOT to be delusional.

RULES:
1. MARKET RESPECT: If a market is extremely confident (>90% or <10%), require STRONG evidence to disagree. Do not bet against a 99% favorite without a "Black Swan" thesis.
2. HUNT FOR ALPHA: In the 20%-80% range, be AGGRESSIVE. If sentiment is wrong, attack it.
3. BE PRECISE: Do not just anchor to the market price. If the market says 50% but the data says 65%, say 65%.
4. NO FEAR: If you have a conviction, state it.

Output strictly valid JSON.`;

      const userPrompt = `
EVENT: ${event.event_title} (${event.event_type})
Volume: $${event.event_metrics.total_volume}
Time left: ${event.time_to_resolution_hours}h

GUIDE: ${typeGuide}

OPTIONS & MARKET PRICES:
${optionsData.map(o => `- "${o.name}": Market says ${o.market_price}%`).join('\n')}

TASK:
Estimate the TRUE probability.
- If Market >90% and justified: Agree (e.g., 95%).
- If Market >90% but fragile: Show the risk (e.g., 85%).
- If Market is 50/50: FIND THE EDGE.

Response JSON format:
{
  "analysis": [
    {
      "option_name": "exact name",
      "core_probability": <0-100 number>,
      "reasoning": "short explanation"
    }
  ]
}
`;

      // 3. Call LLM
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5, // Balanced temp for semi-aggressive logic
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content || "{}";
      let llmResults: any[] = [];
      try {
        const parsed = JSON.parse(content);
        llmResults = parsed.analysis || [];
      } catch (e) {
        console.error("[Error] JSON parse failed", e);
      }

      // 4. Hybrid Integration & Post-Processing
      const analysisOptions: AnalysisOption[] = event.options.map(option => {
        const marketProb = Math.round(option.implied_probability * 100);
        
        // Find LLM result
        const llmResult = llmResults.find((r: any) => 
          r.option_name?.toLowerCase() === option.option_name.toLowerCase() ||
          option.option_name.toLowerCase().includes(r.option_name?.toLowerCase())
        );

        let coreAiScore = llmResult?.core_probability ?? marketProb;

        // Calculate Hybrid Vectors (Removed Social)
        const vectors: VectorScores = {
          newsScore: calculateNewsScore(option.option_name, event.newsArticles || []),
          momentumScore: calculateMomentumScore(
            option.price_change_24h, 
            option.volume_share_percent, 
            event.event_metrics.total_volume,
            event.event_metrics.whaleData // Pass Whale Data
          ),
          coreAiScore: coreAiScore
        };

        // Combine into Final Hybrid Probability
        const hybridResult = calculateHybridProbability(marketProb, event.event_type, vectors);
        
        // Final Score
        const finalScore = hybridResult.finalProbability;

        // Determine Label (Aggressive thresholds)
        const diff = hybridResult.marketDivergence;
        let label: "Underpriced" | "Fairly Priced" | "Overpriced" = "Fairly Priced";
        if (diff > 5) label = "Underpriced";
        if (diff < -5) label = "Overpriced";

        // Generate Explanation
        const explanation = generateHybridExplanation(option.option_name, marketProb, hybridResult);

        return {
          option: option.option_name,
          marketProbability: marketProb,
          aiScore: finalScore,
          pricingLabel: label,
          pricingDeviation: diff,
          note: explanation + (llmResult?.reasoning ? ` (Core: ${llmResult.reasoning})` : ""),
          image: option.image
        };
      })
      // NEW: Sort by Market Probability (Descending) BEFORE returning
      .sort((a, b) => b.marketProbability - a.marketProbability);

      return {
        title: event.event_title,
        market_image: event.market_image,
        category: event.category,
        analysis: analysisOptions
      };

    } catch (error) {
      console.error("[Error] Analysis failed:", error);
      // Fallback
      return {
        title: event.event_title,
        category: event.category,
        analysis: event.options.map(o => ({
          option: o.option_name,
          marketProbability: Math.round(o.implied_probability * 100),
          aiScore: Math.round(o.implied_probability * 100),
          pricingLabel: "Fairly Priced",
          note: "Analysis unavailable.",
          image: o.image
        }))
      };
    }
  }
}
