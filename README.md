# 🎓 Maister - French Learning Analytics Platform

> **An AI-powered platform for analyzing written and oral French productions for FLE (French as a Foreign Language) students.**

---

## 🚀 Deployment (Render)

The application is configured for deployment on [Render](https://render.com) with separate backend and frontend services.

### Architecture

- **Backend**: Web Service ($7/month) with persistent disk storage ($2/month)
- **Frontend**: Static Site (FREE)
- **Total Cost**: ~$9/month

### Prerequisites

1. GitHub repository with your code
2. Render account (sign up at https://render.com)
3. OpenAI API key

### Deployment Steps

#### 1. Backend Service

1. **Connect Repository**: In Render dashboard, click "New +" → "Web Service"
2. **Select Repository**: Connect your GitHub repository
3. **Configure Service**:
   - **Name**: `maister-backend`
   - **Runtime**: Python 3
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Starter ($7/month)

4. **Add Persistent Disk**:
   - Go to your service → "Disks" tab
   - Click "Add Disk"
   - **Name**: `maister-data`
   - **Mount Path**: `/data`
   - **Size**: 2GB ($2/month)

5. **Environment Variables** (in Render dashboard):
   ```
   OPENAI_API_KEY=your_openai_key_here
   PROVIDER=openai
   DATA_DIR=/data
   PYTHON_VERSION=3.13.0
   LOG_LEVEL=INFO
   ```

6. **Deploy**: Click "Create Web Service" and wait for deployment

#### 2. Frontend Service

1. **Create Static Site**: In Render dashboard, click "New +" → "Static Site"
2. **Select Repository**: Connect the same GitHub repository
3. **Configure Service**:
   - **Name**: `maister-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-service.onrender.com
   ```
   (Replace `your-backend-service` with your actual backend service name)

5. **Deploy**: Click "Create Static Site"

#### 3. Update Backend CORS

After frontend is deployed, update backend environment variable:
```
FRONTEND_URL=https://your-frontend-service.onrender.com
```
(Replace with your actual frontend URL)

### Post-Deployment

1. **Test Backend**: Visit `https://your-backend.onrender.com/api/health`
2. **Test Frontend**: Visit your frontend URL and verify API calls work
3. **Monitor Logs**: Check Render dashboard logs for any errors
4. **Verify Data Persistence**: Create a test user and restart backend service to confirm data persists

### Environment Variables Reference

**Backend:**
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `PROVIDER` - Provider name, defaults to "openai"
- `DATA_DIR` - Data directory path, set to `/data` for production
- `FRONTEND_URL` - Frontend URL for CORS (set after frontend deployment)
- `PYTHON_VERSION` - Python version (3.13.0)
- `LOG_LEVEL` - Logging level (INFO)

**Frontend:**
- `VITE_API_URL` - Backend API URL (required)

### Troubleshooting

**Backend won't start:**
- Check logs in Render dashboard
- Verify `build.sh` has execute permissions (handled by build command)
- Ensure all environment variables are set

**CORS errors:**
- Verify `FRONTEND_URL` environment variable is set correctly in backend
- Check that frontend URL matches exactly (including https://)

**Data not persisting:**
- Verify persistent disk is mounted at `/data`
- Check that `DATA_DIR` environment variable is set to `/data`
- Ensure build script creates necessary directories

**Frontend can't connect to backend:**
- Verify `VITE_API_URL` is set correctly in frontend environment variables
- Check backend health endpoint is accessible
- Ensure backend CORS allows frontend origin

### Cost Optimization

- **Free Tier**: Available but services spin down after 15 min inactivity (30-60s cold starts)
- **Starter Plan**: $7/month keeps backend always running (recommended for production)
- **Persistent Disk**: Required for data persistence ($1/GB/month)

### Backup Recommendations

Since we're using JSON files on persistent disk:
- Regularly export user data via API
- Consider migrating to PostgreSQL for better scalability
- Set up automated backups of persistent disk data

---

**Last Updated:** January 2025
