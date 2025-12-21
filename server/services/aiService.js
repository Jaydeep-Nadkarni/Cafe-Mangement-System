const { GoogleGenerativeAI } = require('@google/generative-ai');
const AICache = require('../models/AICache');
const { getAIInsights } = require('./analyticsService');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Craft comprehensive prompt for Gemini AI analysis
 * Includes all 10 sections with structured data
 */
const craftAnalysisPrompt = (aiInsights, branchName = 'Branch') => {
  const { scores, metrics, recommendations, summary, timeRange } = aiInsights;
  
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  const prompt = `You are an expert business analyst for a cafe/restaurant chain. Analyze the following branch performance data and provide detailed insights in 10 specific sections.

**Branch**: ${branchName}
**Time Period**: ${timeRange}
**Generated**: ${formattedDate}

---

## RAW DATA

### Performance Metrics
- Overall Health Score: ${scores.overallHealth}/100
- Performance Score: ${scores.performance.score}/100
  - Revenue Growth: ${scores.performance.breakdown.revenueGrowth.growth}%
  - Completion Rate: ${scores.performance.breakdown.completionRate.rate}%
  - Average Order Value: ₹${scores.performance.breakdown.avgOrderValue.value}
  - Customer Retention: ${scores.performance.breakdown.retention.rate}%

### Efficiency Metrics
- Efficiency Score: ${scores.efficiency.score}/100
  - Table Utilization: ${scores.efficiency.breakdown.tableUtilization.rate}%
  - Menu Diversity: ${scores.efficiency.breakdown.menuDiversity.rate}%
  - Peak Efficiency: ${scores.efficiency.breakdown.peakEfficiency.avgPeakOrders} orders/hour
  - Payment Success Rate: ${scores.efficiency.breakdown.paymentSuccess.rate}%

### Risk Assessment
- Risk Score: ${scores.risk.score}/100 (lower is better)
  - Payment Failures: ${scores.risk.breakdown.paymentFailures.rate}%
  - Order Cancellations: ${scores.risk.breakdown.cancellations.rate}%
  - Revenue Decline: ${scores.risk.breakdown.revenueDeclline.drop}%
  - Low Utilization Risk: ${scores.risk.breakdown.lowUtilization.rate}%

### Coupon Performance
- Coupon Penetration: ${metrics.couponUplift.upliftMetrics.couponPenetration}
- Order Value Uplift: ${metrics.couponUplift.upliftMetrics.orderValueUplift}
- Total Discounts Given: ₹${metrics.couponUplift.upliftMetrics.totalDiscountsGiven}
- Orders with Coupons: ${metrics.couponUplift.orderMetrics.withCoupon.count} (₹${metrics.couponUplift.orderMetrics.withCoupon.revenue})
- Orders without Coupons: ${metrics.couponUplift.orderMetrics.withoutCoupon.count} (₹${metrics.couponUplift.orderMetrics.withoutCoupon.revenue})
${metrics.couponUplift.topCoupons.length > 0 ? `- Top Coupon: ${metrics.couponUplift.topCoupons[0].code} (${metrics.couponUplift.topCoupons[0].uses} uses, ₹${metrics.couponUplift.topCoupons[0].revenue} revenue)` : ''}

### Forecast & Trends
- Trend Direction: ${metrics.forecast.trendDirection}
- Recent Trend: ${metrics.forecast.recentTrend}
- 3-Day Moving Average: ₹${metrics.forecast.movingAverages.ma3Day}
- 7-Day Moving Average: ₹${metrics.forecast.movingAverages.ma7Day}
- Day 1 Forecast: ₹${metrics.forecast.forecast[0].predictedRevenue} (${metrics.forecast.forecast[0].confidence} confidence)
- Day 2 Forecast: ₹${metrics.forecast.forecast[1].predictedRevenue} (${metrics.forecast.forecast[1].confidence} confidence)
- Day 3 Forecast: ₹${metrics.forecast.forecast[2].predictedRevenue} (${metrics.forecast.forecast[2].confidence} confidence)

### Anomalies Detected
- Mean Revenue: ₹${metrics.deviations.baseline.meanRevenue}
- Standard Deviation: ₹${metrics.deviations.baseline.stdDeviation}
- Anomaly Count: ${metrics.deviations.anomalyCount}
${metrics.deviations.anomalies.map(a => `  - Hour ${a.hour}: ₹${a.revenue} (${a.deviation}, ${a.type})`).join('\n')}

### Current Recommendations
${recommendations.map(r => `- [${r.priority.toUpperCase()}] ${r.area}: ${r.insight} → ${r.action}`).join('\n')}

### Summary
- Best Performer: ${summary.bestPerformer}
- Needs Attention: ${summary.needsAttention}

---

## REQUIRED OUTPUT

Please analyze the above data and provide exactly 10 sections in the following format:

### 1. EXECUTIVE SUMMARY
Provide a 3-4 sentence high-level overview of the branch's health, highlighting the most critical metric (overall health score) and the single most important action needed. Be concise and actionable.

### 2. PERFORMANCE ANALYSIS
Deep dive into the performance score breakdown. Explain what's driving performance (positive or negative), compare revenue growth to industry standards, and assess customer retention quality. Provide specific insights on the 4 performance components.

### 3. EFFICIENCY INSIGHTS
Analyze operational efficiency metrics. Discuss table utilization patterns, menu diversity implications, peak hour management, and payment processing reliability. Identify efficiency bottlenecks and quick wins.

### 4. RISK ASSESSMENT
Evaluate the risk score and explain each risk factor. Prioritize risks by severity and business impact. Provide risk mitigation strategies for payment failures, cancellations, revenue declines, and utilization issues.

### 5. COUPON STRATEGY
Analyze coupon effectiveness and ROI. Discuss penetration rate adequacy, order value uplift significance, and top-performing campaigns. Recommend optimization strategies for promotional activities.

### 6. FORECAST ANALYSIS
Interpret the hybrid forecast (moving averages and predictions). Explain the trend direction, assess forecast confidence levels, and discuss seasonal/cyclical patterns. Provide revenue projection insights for the next 3 days.

### 7. ANOMALY EXPLANATION
Explain detected anomalies in the context of operations. Identify potential causes (lunch rush, dinner peak, slow hours, special events). Distinguish between concerning anomalies and expected variations.

### 8. CUSTOMER BEHAVIOR
Synthesize insights about customer patterns from all metrics. Discuss average order value trends, return customer behavior, payment preferences, and engagement with promotions. Identify customer segments.

### 9. OPERATIONAL RECOMMENDATIONS
Provide 5-7 specific, actionable operational improvements based on the data. Prioritize by impact and implementation difficulty. Cover staffing, inventory, menu optimization, and service improvements.

### 10. ACTION PLAN
Create a prioritized 7-day action plan with specific tasks for branch management. Structure as Day 1-3 (immediate), Day 4-5 (short-term), and Day 6-7 (planning phase) actions. Each action should be measurable and time-bound.

---

**IMPORTANT GUIDELINES:**
- Be specific with numbers from the data
- Use business terminology appropriate for restaurant management
- Provide actionable insights, not just observations
- Consider Indian market context (₹ currency, local business practices)
- Keep each section focused and concise (150-250 words per section)
- Use professional but accessible language
- Highlight urgent items in Risk and Action Plan sections
- Base all recommendations on the provided data

Please provide the analysis now in the exact format above, with clear section headers and structured content.`;

  return prompt;
};

/**
 * Parse Gemini response into structured sections
 */
const parseSections = (geminiText) => {
  const sections = {
    executiveSummary: '',
    performanceAnalysis: '',
    efficiencyInsights: '',
    riskAssessment: '',
    couponStrategy: '',
    forecastAnalysis: '',
    anomalyExplanation: '',
    customerBehavior: '',
    operationalRecommendations: '',
    actionPlan: ''
  };

  // Define section markers
  const sectionMarkers = [
    { key: 'executiveSummary', regex: /###\s*1\.\s*EXECUTIVE SUMMARY/i },
    { key: 'performanceAnalysis', regex: /###\s*2\.\s*PERFORMANCE ANALYSIS/i },
    { key: 'efficiencyInsights', regex: /###\s*3\.\s*EFFICIENCY INSIGHTS/i },
    { key: 'riskAssessment', regex: /###\s*4\.\s*RISK ASSESSMENT/i },
    { key: 'couponStrategy', regex: /###\s*5\.\s*COUPON STRATEGY/i },
    { key: 'forecastAnalysis', regex: /###\s*6\.\s*FORECAST ANALYSIS/i },
    { key: 'anomalyExplanation', regex: /###\s*7\.\s*ANOMALY EXPLANATION/i },
    { key: 'customerBehavior', regex: /###\s*8\.\s*CUSTOMER BEHAVIOR/i },
    { key: 'operationalRecommendations', regex: /###\s*9\.\s*OPERATIONAL RECOMMENDATIONS/i },
    { key: 'actionPlan', regex: /###\s*10\.\s*ACTION PLAN/i }
  ];

  // Find section positions
  const positions = sectionMarkers.map(marker => {
    const match = geminiText.match(marker.regex);
    return {
      key: marker.key,
      index: match ? match.index : -1
    };
  }).filter(p => p.index !== -1).sort((a, b) => a.index - b.index);

  // Extract content between sections
  for (let i = 0; i < positions.length; i++) {
    const startIdx = positions[i].index;
    const endIdx = i < positions.length - 1 ? positions[i + 1].index : geminiText.length;

    let content = geminiText.substring(startIdx, endIdx);

    // Remove the section header
    content = content.replace(/###\s*\d+\.\s*[A-Z\s]+/i, '').trim();

    sections[positions[i].key] = content;
  }

  return sections;
};

/**
 * Call Gemini API with the crafted prompt
 */
const callGeminiAPI = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const startTime = Date.now();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const duration = Date.now() - startTime;

    return {
      text,
      metadata: {
        apiCallDuration: duration,
        model: 'gemini-1.5-flash',
        promptLength: prompt.length,
        tokensUsed: text.length // Approximation
      }
    };
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

/**
 * Main function to get AI analysis
 * Uses caching to avoid unnecessary API calls
 */
const getAIAnalysis = async (branchId, branchName = 'Branch', timeRange = '7d') => {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured. Using mock data for demonstration.');
      const mockData = getMockAnalysis(branchName, timeRange);
      const insights = await getAIInsights(branchId, timeRange);

      return {
        _id: 'mock-id',
        branch: branchId,
        timeRange,
        aiInsights: insights,
        sections: mockData.sections,
        metadata: {
          apiCallDuration: 0,
          model: 'Mock AI (Demo)',
          tokensUsed: 0
        },
        cached: false,
        createdAt: new Date()
      };
    }

    // 1. Check cache first
    const cachedAnalysis = await AICache.findValidCache(branchId, timeRange);
    if (cachedAnalysis) {
      console.log(`✓ Using cached AI analysis for branch ${branchId}`);
      return {
        ...cachedAnalysis.toObject(),
        cached: true,
        cacheAge: Date.now() - cachedAnalysis.createdAt.getTime()
      };
    }

    console.log(`⚡ Generating fresh AI analysis for branch ${branchId}...`);

    // 2. Fetch AI insights data
    const aiInsights = await getAIInsights(branchId, timeRange);

    // 3. Craft prompt
    const prompt = craftAnalysisPrompt(aiInsights, branchName);

    // 4. Call Gemini API
    const { text: geminiText, metadata } = await callGeminiAPI(prompt);

    // 5. Parse response into sections
    const sections = parseSections(geminiText);

    // 6. Cache the result
    const cache = await AICache.createOrUpdate(
      branchId,
      timeRange,
      aiInsights,
      { fullText: geminiText },
      sections,
      metadata
    );

    console.log(`✓ AI analysis completed and cached (${metadata.apiCallDuration}ms)`);

    return {
      ...cache.toObject(),
      cached: false,
      cacheAge: 0
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw error;
  }
};

/**
 * Clear cache for a specific branch (useful for testing or force refresh)
 */
const clearCache = async (branchId, timeRange = null) => {
  const query = { branch: branchId };
  if (timeRange) {
    query.timeRange = timeRange;
  }

  const result = await AICache.deleteMany(query);
  console.log(`✓ Cleared ${result.deletedCount} cache entries for branch ${branchId}`);
  return result.deletedCount;
};

/**
 * Get cache statistics
 */
const getCacheStats = async (branchId) => {
  const totalCaches = await AICache.countDocuments({ branch: branchId });
  const validCaches = await AICache.countDocuments({
    branch: branchId,
    expiresAt: { $gt: new Date() }
  });

  const recentCache = await AICache.findOne({ branch: branchId })
    .sort({ createdAt: -1 });

  return {
    total: totalCaches,
    valid: validCaches,
    expired: totalCaches - validCaches,
    lastGenerated: recentCache ? recentCache.createdAt : null,
    lastTimeRange: recentCache ? recentCache.timeRange : null
  };
};

/**
 * Generate mock analysis for demo/fallback
 */
const getMockAnalysis = (branchName, timeRange) => {
  return {
    sections: {
      executiveSummary: `**EXECUTIVE SUMMARY**\n\n${branchName} is showing strong performance with a comprehensive health score of 85/100. The most critical action needed is to optimize peak hour staffing to capitalize on the 15% revenue growth trend. Overall, the branch is in a healthy state with high customer retention.`,
      performanceAnalysis: `**PERFORMANCE ANALYSIS**\n\nPerformance is excellent (Score: 88/100). Revenue has grown by 12% compared to the previous ${timeRange}, outperforming regional benchmarks. Customer retention is a highlight at 65%, indicating high satisfaction. Average Order Value (AOV) matches expectations but has room for growth through upselling.`,
      efficiencyInsights: `**EFFICIENCY INSIGHTS**\n\nOperational efficiency is solid (Score: 82/100). Table turnover is efficient, but menu diversity could be improved as 20% of items drive 80% of sales. Peak hour management is effective, with payment processing success rates near 99%.`,
      riskAssessment: `**RISK ASSESSMENT**\n\nRisk levels are low (Score: 12/100). The primary risk factor is a slight increase in order cancellations (2%) during weekend rushes. Payment failures are negligible. Revenue stability is high, with no significant unexplained drops.`,
      couponStrategy: `**COUPON STRATEGY**\n\nCoupon penetration is at 18%, driving a measurable 25% uplift in order value. The 'WEEKEND20' code is the top performer. We recommend introducing a mid-week happy hour coupon to boost traffic during slower periods.`,
      forecastAnalysis: `**FORECAST ANALYSIS**\n\nThe hybrid forecast predicts a stable upward trend over the next 3 days, with confidence levels >85%. Expect revenue to peak on Saturday evening. No significant negative anomalies are projected.`,
      anomalyExplanation: `**ANOMALY EXPLANATION**\n\nDetected anomalies (2 spike events) correlate directly with the local festival on Tuesday, which drove unexpected footfall. These are positive anomalies. Routine operations remained within 1 standard deviation of the mean.`,
      customerBehavior: `**CUSTOMER BEHAVIOR**\n\nCustomers prefer digital payments (70% UPI/Card). There is a strong segment of returning professionals during lunch hours. Dinner crowds are more experimental with new menu items.`,
      operationalRecommendations: `**OPERATIONAL RECOMMENDATIONS**\n\n1.  **Staffing**: Add one runner during Friday dinner peak.\n2.  **Menu**: Highlight high-margin beverages in the digital menu.\n3.  **Inventory**: Increase stock of dairy alternatives based on recent sales velocity.\n4.  **Service**: Implement table-side ordering for faster turns.\n5.  **Marketing**: Launch a loyalty tier for top 10% customers.`,
      actionPlan: `**ACTION PLAN**\n\n**Immediate (Day 1-3):**\n- Brief staff on upselling strategies.\n- Review weekend inventory levels.\n\n**Short-term (Day 4-5):**\n- Analyze low-performing menu items for removal.\n- Test new 'Happy Hour' coupon configuration.\n\n**Planning (Day 6-7):**\n- Schedule deep cleaning maintenance.\n- Plan next month's seasonal specials.`
    }
  };
};

module.exports = {
  getAIAnalysis,
  clearCache,
  getCacheStats,
  craftAnalysisPrompt,
  parseSections
};
