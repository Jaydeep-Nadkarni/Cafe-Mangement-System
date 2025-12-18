import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';
import {
  Brain,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Award,
  TrendingDown,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import {
  TimeRangeSelector
} from '../../../components/charts';
import {
  SkeletonStats
} from '../../../components/skeletons';
import ErrorBoundary from '../../../components/ErrorBoundary';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SECTIONS = [
  { id: 'executiveSummary', title: 'Executive Summary', icon: Brain, color: 'blue' },
  { id: 'performanceAnalysis', title: 'Performance Analysis', icon: TrendingUp, color: 'green' },
  { id: 'efficiencyInsights', title: 'Efficiency Insights', icon: Zap, color: 'yellow' },
  { id: 'riskAssessment', title: 'Risk Assessment', icon: AlertTriangle, color: 'red' },
  { id: 'couponStrategy', title: 'Coupon Strategy', icon: Award, color: 'purple' },
  { id: 'forecastAnalysis', title: 'Forecast Analysis', icon: TrendingDown, color: 'indigo' },
  { id: 'anomalyExplanation', title: 'Anomaly Explanation', icon: Target, color: 'orange' },
  { id: 'customerBehavior', title: 'Customer Behavior', icon: Users, color: 'pink' },
  { id: 'operationalRecommendations', title: 'Operational Recommendations', icon: CheckCircle, color: 'teal' },
  { id: 'actionPlan', title: 'Action Plan', icon: Calendar, color: 'cyan' }
];

const CHART_COLORS = ['#424242', '#616161', '#757575', '#9e9e9e', '#bdbdbd'];

function AIAnalysisContent({ branch }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ executiveSummary: true });
  const [error, setError] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    if (branch?._id) {
      fetchData();
    }
  }, [branch, timeRange]);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const [analysisRes, aiDataRes] = await Promise.all([
        axios.get(`${API_URL}/api/branch/analytics/ai-analysis?range=${timeRange}${forceRefresh ? '&refresh=true' : ''}`),
        axios.get(`${API_URL}/api/branch/analytics/ai-data?range=${timeRange}`)
      ]);

      setAnalysis(analysisRes.data.data);
      setAiData(aiDataRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching AI data:', err);
      setError(err.response?.data?.message || 'Failed to load AI analysis');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || exporting) return;

    setExporting(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: [10, 10],
        filename: `AI_Analysis_${branch?.name}_${timeRange}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleAllSections = (expand) => {
    const newState = {};
    SECTIONS.forEach(section => {
      newState[section.id] = expand;
    });
    setExpandedSections(newState);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 md:w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 md:w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonStats key={i} />
          ))}
        </div>

        {[1, 2, 3].map(i => (
          <div key={i} className="border border-gray-300 rounded-lg">
            <div className="h-16 bg-gray-100 rounded-t-lg animate-pulse"></div>
            <div className="p-6 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
        <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mb-4" />
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 text-center">Failed to Load AI Analysis</h3>
        <p className="text-sm md:text-base text-gray-600 mb-6 text-center">{error}</p>
        <button
          onClick={() => fetchData()}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  const scores = analysis.aiInsights?.scores || {};
  const sections = analysis.sections || {};
  const metadata = analysis.metadata || {};

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-6 h-6 md:w-7 md:h-7 text-gray-700" />
            AI Business Analysis
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            AI-powered insights and recommendations for {branch?.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 md:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
            title="Refresh analysis"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
            title="Export as PDF"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Report Container for PDF Export */}
      <div ref={reportRef}>
        {/* Cache Status */}
        {analysis.cached && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs md:text-sm text-gray-700">
            <Clock className="w-4 h-4" />
            <span>
              Analysis generated {new Date(analysis.createdAt).toLocaleString()}
              {' - '}
              Using cached data
            </span>
          </div>
        )}

        {/* Health Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <ScoreCard
            title="Overall Health"
            score={scores.overallHealth}
            icon={Brain}
            color="blue"
          />
          <ScoreCard
            title="Performance"
            score={scores.performance?.score}
            icon={TrendingUp}
            color="green"
          />
          <ScoreCard
            title="Efficiency"
            score={scores.efficiency?.score}
            icon={Zap}
            color="yellow"
          />
          <ScoreCard
            title="Risk Level"
            score={scores.risk?.score}
            icon={AlertTriangle}
            color="red"
            inverse
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg mt-6">
          <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          <div className="flex gap-2">
            <button
              onClick={() => toggleAllSections(true)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={() => toggleAllSections(false)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* AI Analysis Sections */}
        <div className="space-y-4 mt-6">
          {SECTIONS.map(section => (
            <AnalysisSection
              key={section.id}
              section={section}
              content={sections[section.id]}
              expanded={expandedSections[section.id]}
              onToggle={() => toggleSection(section.id)}
              aiInsights={analysis.aiInsights}
              aiData={aiData}
            />
          ))}
        </div>

        {/* Metadata Footer */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 mt-6">
          <div className="flex items-center gap-2">
            <span className="font-medium">Analysis Time:</span>
            <span>{metadata.apiCallDuration}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Model:</span>
            <span>{metadata.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Tokens:</span>
            <span>{metadata.tokensUsed?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Generated:</span>
            <span>{new Date(analysis.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Score Card Component
function ScoreCard({ title, score, icon: Icon, color, inverse = false }) {
  const getColorClasses = (score, inverse) => {
    const adjustedScore = inverse ? 100 - score : score;
    
    if (adjustedScore >= 80) return 'bg-green-50 border-green-200 text-green-700';
    if (adjustedScore >= 60) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    if (adjustedScore >= 40) return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-red-50 border-red-200 text-red-700';
  };

  const colorClasses = getColorClasses(score || 0, inverse);

  return (
    <div className={`border rounded-lg p-4 ${colorClasses}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-xl md:text-2xl font-bold">{score || 0}</span>
      </div>
      <p className="text-xs md:text-sm font-medium">{title}</p>
      <div className="mt-2 h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
        <div
          className="h-full bg-current transition-all duration-500"
          style={{ width: `${score || 0}%` }}
        />
      </div>
    </div>
  );
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-gray-700">
          <div 
            className="w-3 h-3 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium">{entry.name}:</span>
          <span>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Analysis Section Component
function AnalysisSection({ section, content, expanded, onToggle, aiInsights, aiData }) {
  const Icon = section.icon;

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700',
      teal: 'bg-teal-50 border-teal-200 text-teal-700',
      cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden page-break-inside-avoid">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 ${getColorClasses(section.color)} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <h3 className="font-semibold text-base md:text-lg">{section.title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="p-4 md:p-6 bg-white space-y-4">
          {content ? (
            <>
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 my-3" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 my-3" {...props} />,
                    li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                    p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-semibold text-gray-900 mt-3 mb-1" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
              
              {section.id === 'performanceAnalysis' && aiInsights?.scores?.performance && (
                <PerformanceChart scores={aiInsights.scores.performance} />
              )}
              
              {section.id === 'anomalyExplanation' && aiInsights?.metrics?.deviations && (
                <AnomalyChart deviations={aiInsights.metrics.deviations} />
              )}
              
              {section.id === 'forecastAnalysis' && aiInsights?.metrics?.forecast && (
                <ForecastChart forecast={aiInsights.metrics.forecast} />
              )}
              
              {section.id === 'couponStrategy' && aiData?.topCoupons && (
                <CouponChart coupons={aiData.topCoupons} />
              )}
            </>
          ) : (
            <p className="text-gray-500 italic text-sm">No analysis available for this section.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Performance Chart Component
function PerformanceChart({ scores }) {
  const data = [
    { metric: 'Revenue', score: scores.revenueScore || 0 },
    { metric: 'Orders', score: scores.orderScore || 0 },
    { metric: 'Growth', score: scores.growthScore || 0 },
    { metric: 'Overall', score: scores.score || 0 }
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance Metrics</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6b7280" />
          <RechartsTooltip content={<CustomTooltip />} />
          <Bar dataKey="score" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Anomaly Chart Component
function AnomalyChart({ deviations }) {
  if (!deviations.anomalies || deviations.anomalies.length === 0) return null;

  const data = deviations.anomalies.map(a => ({
    hour: a.hour,
    revenue: a.revenue,
    deviation: Math.abs(a.deviation),
    type: a.type
  }));

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Hourly Anomalies</h4>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="hour" 
            name="Hour" 
            tick={{ fontSize: 12 }} 
            stroke="#6b7280"
            label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
          />
          <YAxis 
            dataKey="revenue" 
            name="Revenue" 
            tick={{ fontSize: 12 }} 
            stroke="#6b7280"
            label={{ value: 'Revenue', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <RechartsTooltip 
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-sm">
                  <p className="font-semibold text-gray-900">Hour {data.hour}</p>
                  <p className="text-gray-700">Revenue: Rs {data.revenue.toLocaleString()}</p>
                  <p className="text-gray-700">Deviation: {data.deviation.toFixed(1)}%</p>
                  <p className="text-gray-700 capitalize">Type: {data.type}</p>
                </div>
              );
            }}
          />
          <Scatter data={data} fill={CHART_COLORS[1]}>
            {data.map((entry, index) => (
              <Cell 
                key={index} 
                fill={entry.type === 'spike' ? '#ef4444' : '#3b82f6'} 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// Forecast Chart Component
function ForecastChart({ forecast }) {
  if (!forecast.forecast || forecast.forecast.length === 0) return null;

  const data = forecast.forecast.map(f => ({
    day: `Day ${f.day}`,
    revenue: f.predictedRevenue,
    orders: f.predictedOrders,
    confidence: parseInt(f.confidence)
  }));

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-900 mb-1">Revenue Forecast</h4>
      <p className="text-xs text-gray-600 mb-3">
        Trend: {forecast.trendDirection} ({forecast.recentTrend})
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke={CHART_COLORS[0]} 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Revenue"
          />
          <Line 
            type="monotone" 
            dataKey="orders" 
            stroke={CHART_COLORS[1]} 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Coupon Chart Component
function CouponChart({ coupons }) {
  if (!coupons || coupons.length === 0) return null;

  const data = coupons.slice(0, 8).map(c => ({
    name: c.code,
    usage: c.timesUsed,
    revenue: c.totalRevenue,
    roi: parseFloat(c.roi)
  }));

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Coupons</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={80}
            tick={{ fontSize: 11 }} 
            stroke="#6b7280" 
          />
          <RechartsTooltip 
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-sm">
                  <p className="font-semibold text-gray-900">{data.name}</p>
                  <p className="text-gray-700">Usage: {data.usage} times</p>
                  <p className="text-gray-700">Revenue: Rs {data.revenue.toLocaleString()}</p>
                  <p className="text-gray-700">ROI: {data.roi.toFixed(1)}x</p>
                </div>
              );
            }}
          />
          <Bar dataKey="usage" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Main Export with Error Boundary
export default function AIAnalysis({ branch }) {
  return (
    <ErrorBoundary>
      <AIAnalysisContent branch={branch} />
    </ErrorBoundary>
  );
}
