// ============================================================================
// AI Analytics Test Examples
// ============================================================================
// This file contains example curl commands and JavaScript code to test
// the new AI Analytics endpoint

// ============================================================================
// 1. CURL EXAMPLES
// ============================================================================

// Get AI insights with default 7-day range
curl -X GET http://localhost:5000/api/branch/analytics/ai-data \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN" \
  -H "Content-Type: application/json"

// Get AI insights for last 30 days
curl -X GET http://localhost:5000/api/branch/analytics/ai-data?range=30d \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN"

// Get AI insights for today
curl -X GET http://localhost:5000/api/branch/analytics/ai-data?range=today \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN"

// Get AI insights for last hour
curl -X GET http://localhost:5000/api/branch/analytics/ai-data?range=1h \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN"


// ============================================================================
// 2. JAVASCRIPT FETCH EXAMPLES
// ============================================================================

// Example 1: Basic fetch with default range
async function getAIInsights() {
  try {
    const response = await fetch(
      'http://localhost:5000/api/branch/analytics/ai-data',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Insights:', data);
    return data;
  } catch (error) {
    console.error('Error fetching AI insights:', error);
  }
}

// Example 2: Fetch with custom time range
async function getAIInsightsForPeriod(timeRange = '30d') {
  try {
    const url = new URL('http://localhost:5000/api/branch/analytics/ai-data');
    url.searchParams.append('range', timeRange);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    throw error;
  }
}

// Example 3: Using axios
import axios from 'axios';

const getAIInsightsWithAxios = async (timeRange = '7d') => {
  try {
    const response = await axios.get(
      '/api/branch/analytics/ai-data',
      {
        params: { range: timeRange },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};


// ============================================================================
// 3. REACT COMPONENT EXAMPLE
// ============================================================================

import React, { useState, useEffect } from 'react';

const AIAnalyticsDashboard = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, [timeRange]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/branch/analytics/ai-data?range=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading AI insights...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!insights) return <div>No data available</div>;

  return (
    <div className="ai-analytics-dashboard">
      {/* Time Range Selector */}
      <div className="time-range-selector">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="15min">Last 15 Minutes</option>
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Overall Health Score */}
      <div className="health-score">
        <h2>Overall Health Score</h2>
        <div className="score-display">
          {insights.scores.overallHealth}/100
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-section">
        <h3>Performance Score: {insights.scores.performance.score}/100</h3>
        <div className="metric-breakdown">
          <p>Revenue Growth: {insights.scores.performance.breakdown.revenueGrowth.breakdown.growth}%</p>
          <p>Completion Rate: {insights.scores.performance.breakdown.completionRate.rate}%</p>
          <p>Avg Order Value: ₹{insights.scores.performance.breakdown.avgOrderValue.value}</p>
          <p>Customer Retention: {insights.scores.performance.breakdown.retention.rate}%</p>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="metrics-section">
        <h3>Efficiency Score: {insights.scores.efficiency.score}/100</h3>
        <div className="metric-breakdown">
          <p>Table Utilization: {insights.scores.efficiency.breakdown.tableUtilization.rate}%</p>
          <p>Menu Diversity: {insights.scores.efficiency.breakdown.menuDiversity.rate}%</p>
          <p>Peak Efficiency: {insights.scores.efficiency.breakdown.peakEfficiency.avgPeakOrders} orders/hour</p>
          <p>Payment Success: {insights.scores.efficiency.breakdown.paymentSuccess.rate}%</p>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="metrics-section">
        <h3>Risk Score: {insights.scores.risk.score}/100 (Lower is Better)</h3>
        <div className="metric-breakdown">
          <p>Payment Failures: {insights.scores.risk.breakdown.paymentFailures.rate}%</p>
          <p>Cancellations: {insights.scores.risk.breakdown.cancellations.rate}%</p>
          <p>Revenue Decline: {insights.scores.risk.breakdown.revenueDeclline.drop}%</p>
          <p>Low Utilization Risk: {insights.scores.risk.breakdown.lowUtilization.rate}%</p>
        </div>
      </div>

      {/* Coupon Performance */}
      <div className="coupon-section">
        <h3>Coupon Performance</h3>
        <p>Coupon Penetration: {insights.metrics.couponUplift.upliftMetrics.couponPenetration}</p>
        <p>Order Value Uplift: {insights.metrics.couponUplift.upliftMetrics.orderValueUplift}</p>
        <p>Total Discounts Given: ₹{insights.metrics.couponUplift.upliftMetrics.totalDiscountsGiven}</p>
        
        {insights.metrics.couponUplift.topCoupons.length > 0 && (
          <div className="top-coupons">
            <h4>Top Performing Coupons</h4>
            {insights.metrics.couponUplift.topCoupons.map((coupon, idx) => (
              <div key={idx} className="coupon-item">
                <p><strong>{coupon.code}</strong></p>
                <p>Uses: {coupon.uses}</p>
                <p>Revenue: ₹{coupon.revenue}</p>
                <p>Avg Order Value: ₹{coupon.avgOrderValue}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue Forecast */}
      <div className="forecast-section">
        <h3>Revenue Forecast</h3>
        <p>Recent Trend: {insights.metrics.forecast.recentTrend}</p>
        <p>Trend Direction: {insights.metrics.forecast.trendDirection}</p>
        <p>7-Day Moving Average: ₹{insights.metrics.forecast.movingAverages.ma7Day}</p>
        
        <div className="forecast-predictions">
          <h4>Next 3 Days Predictions</h4>
          {insights.metrics.forecast.forecast.map((pred, idx) => (
            <div key={idx} className="prediction">
              <p>Day {pred.day}: ₹{pred.predictedRevenue} ({pred.confidence} confidence)</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies Detection */}
      {insights.metrics.deviations.anomalies.length > 0 && (
        <div className="anomalies-section">
          <h3>Detected Anomalies</h3>
          <p>Baseline Mean Revenue: ₹{insights.metrics.deviations.baseline.meanRevenue}</p>
          <p>Standard Deviation: ₹{insights.metrics.deviations.baseline.stdDeviation}</p>
          
          {insights.metrics.deviations.anomalies.map((anomaly, idx) => (
            <div key={idx} className="anomaly-item">
              <p>Hour {anomaly.hour}: {anomaly.type} ({anomaly.deviation})</p>
            </div>
          ))}
        </div>
      )}

      {/* AI Recommendations */}
      <div className="recommendations-section">
        <h3>AI Recommendations</h3>
        {insights.recommendations.map((rec, idx) => (
          <div key={idx} className={`recommendation priority-${rec.priority}`}>
            <p><strong>{rec.area}</strong> ({rec.priority.toUpperCase()})</p>
            <p>{rec.insight}</p>
            <p><em>Action: {rec.action}</em></p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="summary-section">
        <h3>Summary</h3>
        <p>Best Performer: <strong>{insights.summary.bestPerformer}</strong></p>
        <p>Needs Attention: <strong>{insights.summary.needsAttention}</strong></p>
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;


// ============================================================================
// 4. PROCESSING RESPONSE DATA
// ============================================================================

// Helper function to extract specific metrics
function extractMetrics(insights) {
  return {
    // Scores
    performanceScore: insights.scores.performance.score,
    efficiencyScore: insights.scores.efficiency.score,
    riskScore: insights.scores.risk.score,
    overallHealth: insights.scores.overallHealth,

    // Performance details
    revenueGrowth: insights.scores.performance.breakdown.revenueGrowth.growth,
    completionRate: insights.scores.performance.breakdown.completionRate.rate,
    avgOrderValue: insights.scores.performance.breakdown.avgOrderValue.value,
    retention: insights.scores.performance.breakdown.retention.rate,

    // Coupon metrics
    couponPenetration: parseFloat(insights.metrics.couponUplift.upliftMetrics.couponPenetration),
    orderValueUplift: parseFloat(insights.metrics.couponUplift.upliftMetrics.orderValueUplift),

    // Forecast
    trendDirection: insights.metrics.forecast.trendDirection,
    ma7Day: insights.metrics.forecast.movingAverages.ma7Day,

    // Anomalies
    anomalyCount: insights.metrics.deviations.anomalyCount,

    // Recommendations count
    recommendationCount: insights.recommendations.length
  };
}

// Example: Get alerts for critical issues
function getCriticalAlerts(insights) {
  return insights.recommendations.filter(rec => rec.priority === 'critical');
}

// Example: Check if business is healthy
function isBusinessHealthy(insights) {
  return (
    insights.scores.performance.score >= 70 &&
    insights.scores.efficiency.score >= 70 &&
    insights.scores.risk.score <= 30
  );
}

// Example: Get actionable insights
function getActionableInsights(insights) {
  const actions = [];

  if (insights.scores.performance.score < 60) {
    actions.push('Urgent: Focus on revenue growth and customer retention');
  }

  if (insights.scores.risk.score > 40) {
    actions.push('Alert: Address high-risk factors in operations');
  }

  if (parseFloat(insights.metrics.couponUplift.upliftMetrics.couponPenetration) < 15) {
    actions.push('Opportunity: Increase coupon marketing to boost sales');
  }

  if (insights.metrics.forecast.trendDirection === 'Downward') {
    actions.push('Warning: Revenue trend is declining - take corrective action');
  }

  return actions;
}


// ============================================================================
// 5. PERFORMANCE MONITORING
// ============================================================================

// Track API performance
async function fetchWithMetrics() {
  const startTime = performance.now();

  try {
    const response = await fetch('/api/branch/analytics/ai-data?range=7d', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    const data = await response.json();

    console.log(`API Response Time: ${duration.toFixed(2)}ms`);
    console.log('Data fetched successfully');

    return {
      data,
      duration,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}


// ============================================================================
// 6. ERROR HANDLING
// ============================================================================

async function fetchWithErrorHandling() {
  try {
    const response = await fetch('/api/branch/analytics/ai-data', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    // Handle various HTTP status codes
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login again');
    }

    if (response.status === 403) {
      throw new Error('Forbidden: You do not have access to this branch');
    }

    if (response.status === 404) {
      throw new Error('Not found: Branch analytics not available');
    }

    if (response.status === 500) {
      throw new Error('Server error: Please try again later');
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error.message);
    // Handle error appropriately in UI
    throw error;
  }
}

// ============================================================================
// END OF TEST EXAMPLES
// ============================================================================
