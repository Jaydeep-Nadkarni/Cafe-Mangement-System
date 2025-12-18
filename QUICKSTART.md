# Quick Start Guide - AI Analytics Endpoint

## 🚀 5-Minute Setup

### Step 1: Start Your Server (if not running)
```bash
cd "d:\Programming\Projects\Cafe Management System"
npm start
```

Server should run on `http://localhost:5000`

### Step 2: Get Your Auth Token
```bash
# Login as a branch manager
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"password123"}'

# Copy the token from the response
# Example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Test the AI Endpoint
```bash
# Replace TOKEN with your actual token
curl -X GET http://localhost:5000/api/branch/analytics/ai-data \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### Step 4: View the Response
You should get JSON with:
- `scores.performance` - Performance score (0-100)
- `scores.efficiency` - Efficiency score (0-100)
- `scores.risk` - Risk score (0-100)
- `scores.overallHealth` - Overall health (0-100)
- `metrics` - Forecasts, deviations, coupon analysis
- `recommendations` - AI-generated actionable insights

---

## 📝 Common API Calls

### Get 7-Day Insights (Default)
```bash
curl -X GET http://localhost:5000/api/branch/analytics/ai-data \
  -H "Authorization: Bearer TOKEN"
```

### Get 30-Day Insights
```bash
curl -X GET "http://localhost:5000/api/branch/analytics/ai-data?range=30d" \
  -H "Authorization: Bearer TOKEN"
```

### Get Today's Insights
```bash
curl -X GET "http://localhost:5000/api/branch/analytics/ai-data?range=today" \
  -H "Authorization: Bearer TOKEN"
```

### Get Last Hour Insights
```bash
curl -X GET "http://localhost:5000/api/branch/analytics/ai-data?range=1h" \
  -H "Authorization: Bearer TOKEN"
```

---

## 🧪 Test with Postman

1. **Import from URL** (or create new request):
   - Method: `GET`
   - URL: `http://localhost:5000/api/branch/analytics/ai-data`

2. **Add Authorization Tab**:
   - Type: `Bearer Token`
   - Token: `YOUR_AUTH_TOKEN`

3. **Add Query Parameters** (Optional):
   - Key: `range`
   - Value: `7d` (or `30d`, `today`, `1h`, etc.)

4. **Click Send**

---

## 📊 Understanding the Response

### Scores Interpretation

| Score | Health | Action |
|-------|--------|--------|
| 90-100 | Excellent | Maintain current operations |
| 75-89 | Good | Continue improvements |
| 60-74 | Fair | Address weak areas |
| 45-59 | Poor | Take corrective action |
| 0-44 | Critical | Urgent intervention needed |

### Risk Score (Lower is Better)
- 0-20: Safe zone
- 21-40: Monitor closely
- 41-60: Take action
- 61-80: Urgent attention
- 81-100: Critical situation

### Recommendations Priority
- **Critical** 🔴: Immediate action required
- **High** 🟠: Address within 24 hours
- **Medium** 🟡: Address within 1 week
- **Low** 🟢: Nice to have improvements

---

## 💻 JavaScript Integration

### Fetch API
```javascript
async function getAIInsights(timeRange = '7d') {
  const response = await fetch(
    `http://localhost:5000/api/branch/analytics/ai-data?range=${timeRange}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }
  );
  return await response.json();
}

// Usage
const insights = await getAIInsights('7d');
console.log(`Health Score: ${insights.scores.overallHealth}/100`);
```

### Axios
```javascript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api'
});

async function getAIInsights(timeRange = '7d') {
  const response = await client.get('/branch/analytics/ai-data', {
    params: { range: timeRange },
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  return response.data;
}
```

---

## 🎯 Key Metrics to Monitor

### Performance Score Components
- Revenue Growth: Month-over-month revenue change
- Completion Rate: Orders completed successfully
- Average Order Value: Spending per order
- Customer Retention: Returning customers percentage

### Efficiency Score Components
- Table Utilization: Percentage of tables actively used
- Menu Diversity: Variety of items ordered
- Peak Efficiency: Orders during peak hours
- Payment Success: Successful payment rate

### Risk Score Components (Lower is Better)
- Payment Failures: Failed transaction percentage
- Order Cancellations: Cancelled order percentage
- Revenue Decline: Downtrend detection
- Low Utilization: Underused resources

---

## 📈 Example Insights Analysis

**Scenario 1: Healthy Business**
```json
{
  "scores": {
    "performance": { "score": 85 },
    "efficiency": { "score": 80 },
    "risk": { "score": 15 },
    "overallHealth": 83
  },
  "recommendations": []
}
```
✅ **Action**: Continue current strategy, focus on optimization

**Scenario 2: Declining Revenue**
```json
{
  "metrics": {
    "forecast": {
      "trendDirection": "Downward",
      "recentTrend": "-8.5%"
    }
  },
  "recommendations": [{
    "priority": "high",
    "area": "Forecasting",
    "action": "Implement targeted promotions"
  }]
}
```
⚠️ **Action**: Launch promotional campaigns, review menu pricing

**Scenario 3: High Risk**
```json
{
  "scores": {
    "risk": { "score": 75 }
  },
  "recommendations": [{
    "priority": "critical",
    "area": "Risk",
    "action": "Review payment failures and cancellations"
  }]
}
```
🔴 **Action**: Investigate payment issues, improve order fulfillment

---

## 🔍 Debugging Tips

### Issue: 401 Unauthorized
**Solution**: 
- Token is expired or invalid
- Get a new token from login endpoint
- Verify token is in Authorization header

### Issue: Empty Response
**Solution**:
- Branch has insufficient data
- Try with `range=today` to see if newer data exists
- Check MongoDB connection

### Issue: Slow Response (>1 second)
**Solution**:
- Check MongoDB indexes are created (see ARCHITECTURE_DIAGRAM.md)
- Reduce time range (use `1h` or `today` instead of `30d`)
- Check system resources

### Issue: Null/Undefined in Response
**Solution**:
- This is normal if specific metrics have no data
- Example: If no coupons used, `topCoupons` will be empty
- Frontend should handle null/undefined gracefully

---

## 📚 Full Documentation Files

After testing the endpoint, read these files for deep dives:

1. **AI_ANALYTICS_IMPLEMENTATION.md**
   - Complete API documentation
   - Response schema details
   - Scoring methodology
   - Forecasting methods

2. **ARCHITECTURE_DIAGRAM.md**
   - System architecture
   - Data flow diagrams
   - Database query analysis
   - Performance metrics

3. **PROJECT_STATUS.md**
   - Implementation overview
   - Files modified
   - Key features
   - Future enhancements

4. **TEST_AI_ANALYTICS.js**
   - 50+ code examples
   - React component
   - Error handling
   - Data processing utilities

---

## ✅ Checklist for Production

- [ ] Test endpoint with actual branch data
- [ ] Verify all time ranges work correctly
- [ ] Check response times are acceptable (<500ms)
- [ ] Integrate with frontend dashboard
- [ ] Display scores with visual indicators
- [ ] Show recommendations prominently
- [ ] Set up error handling in UI
- [ ] Test on multiple browsers
- [ ] Load test with concurrent requests
- [ ] Monitor MongoDB performance
- [ ] Set up alerts for critical recommendations
- [ ] Document custom thresholds for your business

---

## 🎓 Learning Path

1. **Start Here**: Run the basic curl command above
2. **Next**: Read the response structure in AI_ANALYTICS_IMPLEMENTATION.md
3. **Then**: Understand the scoring in ARCHITECTURE_DIAGRAM.md
4. **Finally**: Integrate into frontend using TEST_AI_ANALYTICS.js examples

---

## 🆘 Need Help?

### Check These Resources:
1. Review response data structure in `AI_ANALYTICS_IMPLEMENTATION.md`
2. See code examples in `TEST_AI_ANALYTICS.js`
3. Check architecture details in `ARCHITECTURE_DIAGRAM.md`
4. Review project status in `PROJECT_STATUS.md`

### Common Questions:

**Q: What if I get a 404 error?**
A: Make sure the endpoint path is exactly:
```
/api/branch/analytics/ai-data
```
Check the branchRoutes.js file to verify the route is defined.

**Q: What's the difference between scores?**
A: 
- Performance: How well the business is performing
- Efficiency: How well operations are running
- Risk: Potential problems (lower is better)

**Q: Can I change the scoring formula?**
A: Yes! Edit the `calculate*Score()` functions in analyticsService.js

**Q: How often is data updated?**
A: Real-time - data is fetched from MongoDB each request

**Q: Can multiple branches use this endpoint?**
A: Yes, each manager only sees their own branch's data (secure by design)

---

## 📞 Support

For issues or questions:
1. Check the documentation files listed above
2. Review the error message carefully
3. Check browser console for client-side errors
4. Check server logs for backend errors
5. Verify database connection and indexes

---

**Status**: ✅ Ready to use
**Last Updated**: January 2024
**Version**: 1.0.0

Enjoy your AI-powered analytics! 🚀
