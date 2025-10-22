# Deployment guide

## Step 1: Push to GitHub

```bash
# The repo is already initialized and committed. Now create it on GitHub:
# Option 1: Using GitHub CLI (needs repo permission)
gh auth refresh -s repo
gh repo create video-transcribe-describe --public --source=. --remote=origin --push

# Option 2: Manual
# 1. Go to https://github.com/new
# 2. Repository name: video-transcribe-describe
# 3. Make it public
# 4. Don't initialize with README (we already have files)
# 5. Click "Create repository"
# 6. Run these commands:
git remote add origin https://github.com/NikolayS/video-transcribe-describe.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Render

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `NikolayS/video-transcribe-describe`
4. Configure:
   - **Name**: video-transcribe-backend
   - **Region**: Choose closest to you
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
5. Add Environment Variable:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. **Copy your backend URL** (will be something like `https://video-transcribe-backend.onrender.com`)

## Step 3: Update Frontend Configuration

1. Edit `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-actual-backend-url.onrender.com
   ```

2. Commit and push:
   ```bash
   git add frontend/.env.production
   git commit -m "Update backend URL for production"
   git push
   ```

## Step 4: Deploy Frontend to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you don't have it
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# When prompted:
# - Set up and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: video-transcribe-describe
# - In which directory: ./
# - Override settings: No

# Deploy to production
vercel --prod
```

### Option B: Using Vercel Website

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `NikolayS/video-transcribe-describe`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://video-transcribe-backend.onrender.com`)
6. Click "Deploy"
7. Wait 2-3 minutes

## Step 5: Test Your Deployment

1. Visit your Vercel URL (e.g., `https://video-transcribe-describe.vercel.app`)
2. Upload a test video
3. Verify:
   - Upload works
   - Processing shows progress
   - Results display correctly

## Important Notes

### Backend (Render Free Tier)
- Spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free (enough for personal use)

### Costs
- **Render**: Free tier
- **Vercel**: Free tier (generous limits)
- **OpenAI API**: Pay-per-use
  - Whisper: ~$0.006/minute of audio
  - GPT-4 Vision: ~$0.01/image

### Troubleshooting

**Backend not responding:**
- Check Render logs for errors
- Verify OPENAI_API_KEY is set
- Free tier spins down - wait 30s for first request

**Frontend can't reach backend:**
- Verify VITE_API_URL in Vercel environment variables
- Check CORS is allowing your Vercel domain
- Redeploy frontend after changing env vars

**CORS errors:**
The backend already has CORS enabled with `allow_origins=["*"]`. If you want to restrict it:
1. Edit `backend/main.py`
2. Change `allow_origins=["*"]` to `allow_origins=["https://your-app.vercel.app"]`
3. Commit and push (Render will auto-deploy)

## Alternative: Deploy Backend to Railway

If you prefer Railway over Render:

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Configure:
   - Root directory: `backend`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Railway will auto-detect Python and deploy

Railway also has a free tier and is very user-friendly!

