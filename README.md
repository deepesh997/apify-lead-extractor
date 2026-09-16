# Apify Lead Extraction Agent (Vercel Ready)

An autonomous AI agent web application that extracts structured professional contact data from **Apify** based on user-supplied keywords (e.g. *"Senior React Developer"*, *"VP of Marketing San Francisco"*).

### Standard Output Fields
- **Name**: Cleansed personal name
- **Phone Number**: Standardized E.164 and localized contact numbers
- **Email**: Verified email address
- **Designation**: Job title, specialization, and current organization
- **Experience**: Seniority level, career tenure, or total years of experience

---

## 🚀 Instant Deployment to Vercel

### Method 1: Deploy via Vercel Web Dashboard (1-Click)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import repository **`deepesh997/apify-lead-extractor`**.
3. Under **Environment Variables**, add:
   - `APIFY_API_TOKEN`: *(your Apify API Token from https://console.apify.com/account/integrations)*
4. Click **Deploy**!

### Method 2: Deploy via Vercel CLI
```bash
npx vercel
npx vercel env add APIFY_API_TOKEN
npx vercel --prod
```

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).
