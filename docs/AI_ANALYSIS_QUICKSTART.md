# AI Analysis Service - Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd server
npm install
```

This installs `@google/generative-ai` package.

### Step 2: Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### Step 3: Configure Environment Variable

Add to your `server/.env` file:
```env
GEMINI_API_KEY=your_api_key_here
```

### Step 4: Start the Server
```bash
npm run dev
```

### Step 5: Test the Endpoint

```bash
# Login first to get your auth token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"password123"}'

# Copy the token from response, then:
curl -X GET http://localhost:5000/api/branch/analytics/ai-analysis?range=7d \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 What You Get

The endpoint returns AI-powered analysis with **10 comprehensive sections**:

1. **Executive Summary** - High-level overview and critical action
2. **Performance Analysis** - Revenue, orders, retention deep dive
3. **Efficiency Insights** - Operations optimization opportunities
4. **Risk Assessment** - Problems and mitigation strategies
5. **Coupon Strategy** - Promotion effectiveness analysis
6. **Forecast Analysis** - Revenue predictions (3-day)
7. **Anomaly Explanation** - Unusual pattern interpretation
8. **Customer Behavior** - Customer insights and segments
9. **Operational Recommendations** - 5-7 actionable improvements
10. **Action Plan** - 7-day prioritized task list

---

## 💾 Caching (Automatic)

- **First request**: Takes 2-5 seconds (calls Gemini API)
- **Subsequent requests**: Returns in <10ms (uses cache)
- **Cache duration**: 24 hours
- **Cost savings**: ~95% reduction in API calls

---

## 🔧 API Endpoints

### Get AI Analysis
```bash
GET /api/branch/analytics/ai-analysis?range=7d
```

**Parameters:**
- `range`: `15min`, `1h`, `6h`, `today`, `7d`, `30d`
- `refresh`: `true` to bypass cache

### Clear Cache
```bash
DELETE /api/branch/analytics/ai-cache
```

### Get Cache Stats
```bash
GET /api/branch/analytics/ai-cache-stats
```

---

## 📝 Example Response Structure

```json
{
  "success": true,
  "data": {
    "sections": {
      "executiveSummary": "Your branch shows strong performance...",
      "performanceAnalysis": "Revenue growth of 8.7%...",
      "efficiencyInsights": "Table utilization at 85%...",
      "riskAssessment": "Payment failures at 2%...",
      "couponStrategy": "Coupon penetration at 11%...",
      "forecastAnalysis": "Upward trend predicted...",
      "anomalyExplanation": "Hour 12 spike due to lunch rush...",
      "customerBehavior": "Average order value ₹625...",
      "operationalRecommendations": "1. Increase staff during peak hours...",
      "actionPlan": "Day 1-3: Address payment failures..."
    },
    "metadata": {
      "apiCallDuration": 2500,
      "model": "gemini-1.5-flash",
      "tokensUsed": 4800
    },
    "cached": false
  },
  "branch": {
    "id": "...",
    "name": "Downtown Branch"
  },
  "timeRange": "7d"
}
```

---

## 🎨 Frontend Integration Snippet

```javascript
const AIAnalysisPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/branch/analytics/ai-analysis?range=7d', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setAnalysis(data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Generating AI insights...</div>;

  return (
    <div>
      <h1>AI Business Analysis</h1>
      <section>
        <h2>Executive Summary</h2>
        <p>{analysis.sections.executiveSummary}</p>
      </section>
      {/* Render other 9 sections */}
    </div>
  );
};
```

---

## ⚠️ Troubleshooting

### Error: "GEMINI_API_KEY not configured"
**Fix:** Add API key to `.env` file

### Error: "AI analysis failed"
**Possible causes:**
1. Invalid API key
2. No internet connection
3. API quota exceeded

**Debug:**
```bash
# Check API key is set
cat server/.env | grep GEMINI

# Check server logs
npm run dev
```

### Slow response (>5 seconds)
**Cause:** First request generates fresh analysis
**Fix:** Wait, then subsequent requests use cache (<10ms)

---

## 📈 Cost Estimation

**Without caching:**
- 30 requests/day × $0.40/request = **$12/day** = **$360/month**

**With caching (24-hour):**
- 1 request/day × $0.40/request = **$0.40/day** = **$12/month**

💡 **Caching saves 97% in API costs!**

---

## 🔐 Security Notes

- API key stored in `.env` (server-side only)
- All endpoints require authentication
- Branch managers only access their own data
- API calls made server-side (key never exposed)

---

## 📚 Full Documentation

See [AI_ANALYSIS_SERVICE_DOCS.md](./AI_ANALYSIS_SERVICE_DOCS.md) for:
- Complete API reference
- All 10 section descriptions
- Advanced usage examples
- Architecture details
- Performance optimization

---

## ✅ Quick Test Checklist

- [ ] Installed `npm install`
- [ ] Added `GEMINI_API_KEY` to `.env`
- [ ] Started server with `npm run dev`
- [ ] Logged in to get auth token
- [ ] Called `/ai-analysis` endpoint
- [ ] Received 10-section response
- [ ] Verified caching works (2nd request fast)

---

**Status**: ✅ Ready to Use  
**Setup Time**: ~5 minutes  
**First Response**: 2-5 seconds  
**Cached Response**: <10ms

Happy analyzing! 🎉
