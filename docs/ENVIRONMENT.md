# Environment Variables Documentation

Complete reference for all environment variables used in the Cafe Management System.

## Client Environment Variables

Configuration file: `client/.env`

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` | Yes |
| `REACT_APP_RAZORPAY_KEY_ID` | Razorpay public key ID | `rzp_test_xxxxx` | Yes |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REACT_APP_ENVIRONMENT` | Environment name | `development` | `production` |

---

## Server Environment Variables

Configuration file: `server/.env`

### Server Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `5000` | No (default: 5000) |
| `NODE_ENV` | Node environment | `development` or `production` | No |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` | Yes |

### Database Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cafe_management` | Yes |

**MongoDB Atlas Example:**
```
mongodb+srv://username:password@cluster.mongodb.net/cafe_management?retryWrites=true&w=majority
```

### Payment Gateway (Razorpay)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RAZORPAY_KEY_ID` | Razorpay public key ID | `rzp_test_xxxxx` | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | `xxxxxxxxxxx` | Yes |

**Getting Razorpay Keys:**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings → API Keys
3. Generate Test or Live keys
4. Test keys start with `rzp_test_`
5. Live keys start with `rzp_live_`

### AI Configuration - OpenAI

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-xxxxxxxxxxxxx` | Yes* |
| `OPENAI_MODEL` | OpenAI model name | `gpt-3.5-turbo` | No |

**Available OpenAI Models:**
- `gpt-3.5-turbo` (Recommended, cost-effective)
- `gpt-4`
- `gpt-4-turbo-preview`

**Getting OpenAI API Key:**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Click "Create new secret key"
5. Copy and save the key (shown only once)

### AI Configuration - Google Gemini (Alternative)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | `xxxxxxxxxxxxx` | Yes* |
| `GEMINI_MODEL` | Gemini model name | `gemini-pro` | No |

*Either OpenAI or Gemini is required for AI features.

**Getting Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key

### Authentication (JWT)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing | `random_secret_string_here` | Yes |
| `JWT_EXPIRE` | Token expiration time | `7d` | No (default: 7d) |

**Generating JWT Secret:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### Email Configuration (Optional)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` | No |
| `EMAIL_PORT` | SMTP server port | `587` | No |
| `EMAIL_USER` | Email account | `your_email@gmail.com` | No |
| `EMAIL_PASSWORD` | Email password/app password | `xxxxxxxxxxx` | No |

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the app password as `EMAIL_PASSWORD`

### Image Upload (Optional)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `xxxxxxxxxxxxx` | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `xxxxxxxxxxxxx` | No |

**Getting Cloudinary Credentials:**
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Navigate to Dashboard
3. Copy Cloud Name, API Key, and API Secret

---

## Environment-Specific Configurations

### Development Environment

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Use test/development API keys
RAZORPAY_KEY_ID=rzp_test_xxxxx
OPENAI_MODEL=gpt-3.5-turbo

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/cafe_management_dev
```

### Production Environment

```env
# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com

# Use live API keys
RAZORPAY_KEY_ID=rzp_live_xxxxx
OPENAI_MODEL=gpt-4

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cafe_management

# Strong JWT secret
JWT_SECRET=your_very_strong_production_secret_here
```

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for development and production
3. **Rotate API keys** regularly
4. **Use strong JWT secrets** (minimum 32 characters)
5. **Restrict MongoDB access** by IP whitelist
6. **Enable 2FA** on all service accounts
7. **Use environment variables** for all sensitive data
8. **Monitor API usage** to detect unauthorized access

---

## Validation Checklist

Before running the application, ensure:

- [ ] All required variables are set
- [ ] API keys are valid and active
- [ ] Database connection string is correct
- [ ] URLs match your environment (dev/prod)
- [ ] No spaces or quotes in values (unless needed)
- [ ] JWT_SECRET is strong and unique
- [ ] Client and server `.env` files are both configured

---

## Troubleshooting

### Issue: "Missing environment variable"
**Solution:** Check that all required variables are set in your `.env` file

### Issue: "Invalid API key"
**Solution:** Verify the API key is correct and not expired

### Issue: "MongoDB connection failed"
**Solution:** 
- Check MongoDB is running
- Verify connection string format
- Ensure IP is whitelisted (MongoDB Atlas)

### Issue: "CORS error"
**Solution:** Ensure `CLIENT_URL` in server matches your frontend URL exactly

---

## References

- [Razorpay Documentation](https://razorpay.com/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [Google Gemini API](https://ai.google.dev/docs)
- [JWT Best Practices](https://jwt.io/introduction)
