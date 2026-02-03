import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

export interface MarketOption {
  option_name: string;
  image?: string | null;
  implied_probability: number;
  volume_share_percent: number;
  price_change_24h: number;
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
  };
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

export class MarketAnalyst {
  async analyze(event: MarketEvent): Promise<SimplifiedAnalysisResult> {
    try {
      // Build batch prompt for all options at once
      const optionsData = event.options.map(opt => ({
        name: opt.option_name,
        market_price: Math.round(opt.implied_probability * 100),
        image: opt.image
      }));

      // Type-specific analysis guidelines
      const typeGuidelines: Record<string, string> = {
        sports: `SPORTS ANALYSIS FOCUS:
- Use historical head-to-head records, recent form, injuries, and venue advantages.
- Sports markets often overreact to recent losses/wins (recency bias).
- Look for value in underdogs when public heavily backs favorites.
- Consider rest days, travel fatigue, and motivation factors.`,
        
        politics: `POLITICAL ANALYSIS FOCUS:
- Analyze polling data, endorsements, fundraising, and demographic trends.
- Political markets often have partisan bias - adjust accordingly.
- Consider historical precedents and institutional factors.
- Watch for momentum shifts from debates, scandals, or major endorsements.`,
        
        crypto: `CRYPTO/FINANCE ANALYSIS FOCUS:
- Crypto markets are highly volatile - factor in market sentiment and whale activity.
- Look for on-chain data signals, exchange flows, and social sentiment.
- Markets often overshoot on both hype and FUD.
- Consider macro factors: interest rates, regulatory news, BTC correlation.`,
        
        pop: `POP CULTURE ANALYSIS FOCUS:
- Social media trends and engagement metrics are key indicators.
- Celebrity behavior is unpredictable - account for high uncertainty.
- Look for insider information patterns and leaked data.
- Markets may underreact to subtle signals and overreact to headlines.`,
        
        other: `GENERAL ANALYSIS FOCUS:
- Apply first-principles reasoning to assess base rates.
- Look for information asymmetries and crowd blind spots.
- Consider resolution criteria carefully - ambiguity affects pricing.
- Factor in time decay and how new information might shift odds.`
      };

      const typeGuide = typeGuidelines[event.event_type] || typeGuidelines.other;

      const prompt = `You are PredictlyAI, an elite prediction market analyst with expertise in probability assessment, market inefficiencies, and event analysis.

## EVENT TO ANALYZE
Title: ${event.event_title}
Category: ${event.category} | Type: ${event.event_type.toUpperCase()}
Total Volume: $${event.event_metrics.total_volume.toLocaleString()}
24h Volume: $${event.event_metrics.volume_last_24h.toLocaleString()}
Time to Resolution: ${event.time_to_resolution_hours.toFixed(1)} hours
Active Traders: ~${event.event_metrics.total_wallets}

## ${typeGuide}

## CURRENT MARKET PRICES
${optionsData.map((opt, i) => `${i + 1}. "${opt.name}" ? Market Price: ${opt.market_price}%`).join('\n')}

## YOUR TASK
For EACH option above, provide your independent probability assessment. Your AI probability should reflect YOUR analysis, NOT just copy the market price.

CRITICAL RULES:
1. Your ai_probability MUST differ from market price when you see mispricing. Don't just echo market prices!
2. If market is overvaluing something (hype, recency bias, crowd behavior), your ai_probability should be LOWER.
3. If market is undervaluing something (overlooked factors, contrarian view), your ai_probability should be HIGHER.
4. Even for fairly priced options, show small divergence (±2-5%) to reflect model uncertainty.
5. Be bold - if you see a 10%+ mispricing, say so. That's alpha.

EXPLANATION FORMAT (2-3 sentences each):
- Sentence 1: "I assess [X]% probability vs market's [Y]% - [overpriced/underpriced/fair]."
- Sentence 2: Key factor driving your view (be specific to the event type).
- Sentence 3: Trading implication - what should traders do?

## RESPONSE FORMAT (strict JSON)
{
  "analysis": [
    {
      "option_name": "exact option name",
      "ai_probability": <your probability 0-100>,
      "pricing_label": "Underpriced" | "Fairly Priced" | "Overpriced",
      "explanation": "Your 2-3 sentence analysis."
    }
  ]
}

pricing_label rules:
- "Underpriced" if ai_probability > market_price + 5
- "Overpriced" if ai_probability < market_price - 5  
- "Fairly Priced" if within ±5%

Analyze now:`;

      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `You are PredictlyAI, a quantitative analyst specializing in ${event.event_type} prediction markets. You identify mispricings using data-driven analysis. Your ai_probability is YOUR independent view - disagree with the market when you see edge. Always return valid JSON. Be direct, confident, and actionable.` 
          },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7, // Slightly higher for more divergent thinking
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content || '{"analysis":[]}';
      
      let results: any[] = [];
      try {
        const parsed = JSON.parse(content);
        results = parsed.analysis || parsed.results || [];
        if (!Array.isArray(results)) {
          console.error("Response analysis is not an array, using empty results");
          results = [];
        }
        console.log(`? Successfully parsed AI analysis for ${results.length} options`);
      } catch (e) {
        console.error("? JSON Parse Error:", e);
        console.error("Failed content (first 500 chars):", content.substring(0, 500));
        console.log("Using fallback analysis...");
        results = [];
      }

      const analysisOptions: AnalysisOption[] = event.options.map(option => {
        const marketProb = Math.round(option.implied_probability * 100);
        const analysis = results.find((r: any) => 
          r.option_name?.toLowerCase() === option.option_name.toLowerCase()
        );

        let aiProb = marketProb;
        let pricingLabel: "Underpriced" | "Fairly Priced" | "Overpriced" = "Fairly Priced";
        let explanation = "";

        if (analysis && analysis.explanation) {
          aiProb = Math.min(100, Math.max(0, analysis.ai_probability || marketProb));
          pricingLabel = analysis.pricing_label || "Fairly Priced";
          explanation = analysis.explanation;
        } else {
          // Generate basic analysis if AI fails
          explanation = `AI analysis temporarily unavailable. Market is currently pricing this at ${marketProb}%. Manual analysis recommended.`;
        }

        // Calculate deviation
        const deviation = aiProb - marketProb;

        return {
          option: option.option_name,
          marketProbability: marketProb,
          aiScore: Math.round(aiProb),
          pricingLabel: pricingLabel,
          pricingDeviation: deviation,
          note: explanation,
          image: option.image
        };
      });

      return {
        title: event.event_title,
        market_image: event.market_image,
        category: event.category,
        analysis: analysisOptions
      };

    } catch (error) {
      console.error("Analysis Error:", error);
      
      // Check if it's a rate limit error
      const isRateLimit = error instanceof Error && 
        (error.message.includes('rate_limit') || error.message.includes('429'));
      
      const fallbackAnalysis = event.options.map(opt => {
        const marketProb = Math.round(opt.implied_probability * 100);
        const note = isRateLimit 
          ? `AI analysis temporarily unavailable due to high demand. Market is currently pricing this at ${marketProb}%. Manual analysis recommended.`
          : `Analysis service temporarily unavailable. Current market consensus: ${marketProb}%.`;
        
        return {
          option: opt.option_name,
          marketProbability: marketProb,
          aiScore: marketProb,
          pricingLabel: "Fairly Priced" as const,
          note: note,
          image: opt.image
        };
      });

      return {
        title: event.event_title,
        market_image: event.market_image,
        category: event.category,
        analysis: fallbackAnalysis
      };
    }
  }
}

