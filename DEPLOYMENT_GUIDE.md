# 🚀 Deployment Guide - Free Hosting Setup

This guide will help you deploy the Medical Inventory System to the cloud for free using Vercel (frontend) and Render (backend).

## 📊 Architecture Overview

```
GitHub Repository (Single repo, both frontend + backend)
    ├── /src              → Frontend (React) → Vercel
    ├── /backend          → Backend (Node.js) → Render
    └── /package.json     → Frontend config
```

**Cost**: $0/month (free tier)

---

## Prerequisites

Before you start, you need:
- GitHub account (free)
- MongoDB Atlas account (free)
- Vercel account (free)
- Render account (free)

---

## 🔧 Step 1: Set Up MongoDB Atlas (FREE Database)

### 1.1 Create MongoDB Account
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Click **"Sign Up Free"**
3. Sign up with your email
4. Verify your email address

### 1.2 Create Free Cluster
1. Click **"Create Deployment"**
2. Select **"Free"** (M0 Sandbox - 5GB storage)
3. Choose region closest to you
4. Click **"Create Deployment"**
5. Wait 5-10 minutes for cluster to be ready

### 1.3 Add Database User
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Create username: `medical-admin`
4. Create password: Choose a strong password (save it!)
5. Click **"Add User"**

### 1.4 Add Network Access
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Select **"Allow access from anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Go back to **Clusters** 
2. Click **"Connect"** button
3. Select **"Drivers"**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Example: `mongodb+srv://medical-admin:YOUR_PASSWORD@cluster.mongodb.net/medical-inventory`

**✅ Save this connection string - you'll need it later!**

---

## 📝 Step 2: Push Code to GitHub

### 2.1 Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `medical-inventory-system`
3. Description: `Medical Inventory Management System`
4. Choose **Public** (so GitHub Pages recognizes it)
5. Click **"Create repository"**

### 2.2 Push Your Code
In terminal, from project root:

```bash
# Initialize git (if not already done)
git init

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/medical-inventory-system.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: Medical inventory system"

# Push to GitHub
git branch -M main
git push -u origin main
```

**✅ Your code is now on GitHub!**

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** and select **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub
4. Click **"Import Project"**
5. Select your `medical-inventory-system` repository

### 3.2 Configure Vercel
In the import dialog:

**Build & Output Settings:**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Environment Variables:**
Click **"Add Environment Variable"** and add:
- **Name**: `VITE_API_URL`
- **Value**: `https://medical-inventory-backend.onrender.com` (you'll get the exact URL after Render deployment)

### 3.3 Deploy
Click **"Deploy"** and wait 2-3 minutes

**✅ Your frontend is live at**: `https://YOUR_PROJECT_NAME.vercel.app`

---

## ⚙️ Step 4: Deploy Backend to Render

### 4.1 Connect to Render
1. Go to [render.com](https://render.com)
2. Click **"Sign Up"** and select **"Continue with GitHub"**
3. Authorize Render to access your GitHub
4. Click **"New +"** → **"Web Service"**
5. Select your `medical-inventory-system` repository

### 4.2 Configure Render
Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `medical-inventory-backend` |
| **Branch** | `main` |
| **Build Command** | `npm install --prefix backend` |
| **Start Command** | `node backend/src/server.js` |
| **Environment** | `Node` |
| **Region** | Choose closest to you |

### 4.3 Add Environment Variables
Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your-secure-secret-key-12345` (change this!) |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

### 4.4 Deploy
Click **"Create Web Service"** and wait 5-10 minutes

**✅ Your backend is live at**: `https://medical-inventory-backend.onrender.com`

---

## 🔗 Step 5: Update Frontend Environment Variable

Now that you have your backend URL, update Vercel:

### 5.1 Update Vercel Settings
1. Go to your Vercel project dashboard
2. Click **"Settings"**
3. Go to **"Environment Variables"**
4. Find `VITE_API_URL` and update it to your Render backend URL
5. Click **"Save"**
6. Click **"Deployments"** → redeploy the latest commit

---

## ✅ Step 6: Test Your Deployment

1. **Open your frontend**: `https://YOUR_PROJECT_NAME.vercel.app`
2. **Test login**: Use credentials from backend setup
3. **Create inventory item**: Verify it saves
4. **Check MongoDB**: Verify data appears in MongoDB Atlas

If everything works - **Congratulations! 🎉**

---

## 📱 Important Notes

### ⏰ Render Free Tier Behavior
- **Spins down after 15 minutes of inactivity**
- **First request after spin-down takes ~30 seconds**
- This is normal and free - upgrade anytime if needed

### 🔐 Production Security
Before going fully live, update:
1. **JWT_SECRET**: Change from default value
2. **Database user password**: Use strong password
3. **Allowed IPs**: If restricting, whitelist Render IP

### 📈 Scaling Up
Free tier limits:
- **Database**: 5GB storage (enough for ~100k items)
- **Backend**: 750 hours compute/month (24/7 for 1 web service)
- **Frontend**: Unlimited bandwidth

Upgrade when you need more.

---

## 🆘 Troubleshooting

### Backend Returns 500 Error
- Check Render logs: Dashboard → Select service → Logs
- Verify MongoDB connection string
- Verify environment variables are set correctly

### Frontend Can't Connect to API
- Check `VITE_API_URL` is correct in Vercel
- Browser console (F12) → Network tab to see request URL
- Verify backend is running (not spun down)

### Data Not Saving
- Check MongoDB Atlas cluster status (should say "Active")
- Verify database user has correct password
- Check IP whitelist includes 0.0.0.0/0

### Lost Access to MongoDB
- Go to MongoDB Atlas → Database Access
- Reset password for your user
- Update connection string everywhere

---

## 📚 Next Steps

1. **Monitor**: Check Render/Vercel dashboards for errors
2. **Backup**: Set up MongoDB Atlas backups
3. **Scale**: Upgrade when free tier isn't enough
4. **Custom Domain**: Add your domain to Vercel (optional, free SSL)

---

**Deployment Complete! 🚀**

Your Medical Inventory System is now live and accessible worldwide at no cost!
