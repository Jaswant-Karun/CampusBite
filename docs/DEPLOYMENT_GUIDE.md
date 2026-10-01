# CampusBite Cloud Deployment & PWA Installation Guide

CampusBite is pre-configured for free one-click cloud hosting and instant Progressive Web App (PWA) installation.

---

## 🚀 Option 1: Free 1-Click Deployment on Render.com (Recommended)

1. **Sign Up / Log In**:
   - Go to [render.com](https://render.com) and sign in with your GitHub account.
2. **Create New Web Service**:
   - Click **New +** ➔ **Web Service**.
   - Select your GitHub repository: `Jaswant-Karun/CampusBite`.
3. **Configure Settings**:
   - **Name**: `campusbite`
   - **Region**: Singapore or Frankfurt (closest to India)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
   - **Plan**: `Free`
4. **Environment Variables (Optional)**:
   - `MONGODB_URI`: Your MongoDB Atlas cluster connection string (e.g. `mongodb+srv://user:pass@cluster0.mongodb.net/campusbite`).
   - *(Note: If MongoDB is omitted, CampusBite automatically operates in high-speed JSON memory mode).*
5. **Click Deploy**:
   - In 1 to 2 minutes, Render gives you a live public HTTPS URL:
   - `https://campusbite.onrender.com`

---

## 🚂 Option 2: Deploy on Railway.app

1. Go to [railway.app](https://railway.app) and click **Start a New Project**.
2. Select **Deploy from GitHub repo** ➔ choose `Jaswant-Karun/CampusBite`.
3. Railway automatically detects the included [`Procfile`](file:///c:/Users/jaswant%20karun/CampusBite/Procfile) and starts `node backend/server.js`.
4. Under **Settings** ➔ **Networking**, click **Generate Domain** to get your public HTTPS link.

---

## 📱 PWA Mobile App Installation on Smartphones

Once deployed online or opened locally over Wi-Fi:

### Android & Chrome:
1. Open the website in Google Chrome.
2. Tap the **"📲 Install App"** button in the header, or open the Chrome menu (three dots) and tap **"Install App"** / **"Add to Home screen"**.
3. CampusBite installs as a standalone app with a full-screen mobile icon on your home screen.

### iOS & Safari (iPhone / iPad):
1. Open the website in Safari.
2. Tap the **Share** button (box with an upward arrow at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top-right corner.
