# TypeFlow - Premium Multiplayer Typing Practice 🚀

TypeFlow is a fast, visually stunning, and competitive web-based typing practice platform built with Node.js and Socket.io. It challenges users to improve their typing speed, track their daily progress, and race head-to-head with others in real-time.

![TypeFlow UI Mockup Placeholder](https://via.placeholder.com/800x450.png?text=TypeFlow+Interactive+Typing+App)

## ✨ Key Features

1. **State-of-the-Art UX/UI**: Implements dynamic glassmorphism panels layered over an animated, pulsing particle canvas background. Highly reactive and smooth CSS animations make typing feel immersive and responsive.
2. **Real-time Performance Tracking**: Calculates and dynamically updates your Net WPM (Words Per Minute) and Accuracy percentage keystroke by keystroke. 
3. **Live Multiplayer Arena**: Join the arena and race against opponents in real-time. Employs `Socket.io` to transmit instant progress updates and determine the match winner.
4. **Daily Progression System**: A built-in daily task progress bar tracks your runs locally and encourages you to reach peak performance (e.g., hitting the 80 WPM daily goal).

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism & Advanced Selectors), and pure JavaScript with HTML5 Canvas routing for aesthetic background effects.
- **Backend Environment**: Node.js and Express.js.
- **WebSockets / Multiplayer**: `Socket.io` v4 handles real-time bi-directional event transmission for the multiplayer matchmaking and progress arrays.

## 🚀 Getting Started Locally

1. **Install Dependencies:**
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```
2. **Run the Server:**
   ```bash
   npm start
   ```
3. **Open the Game:**
   Visit `http://localhost:3000` in your browser. Open multiple tabs to test the Multiplayer Arena out!

## ☁️ Deployment Notes

### Deploying to GitHub manually using Script
You can use the built-in `push-typeflow.js` script to directly push these files using a GitHub Personal Access token:
```bash
node push-typeflow.js <YOUR_GITHUB_PAT>
```

### Deploying to Vercel
The project includes a `vercel.json` file properly configured to execute the Node/Express backend. **However**, because Vercel uses ephemeral Serverless Functions, long-lived `Socket.io` WebSockets will face timeout constraints. 

For full multiplayer Socket functionality in production, consider deploying this repository via **Railway.app** or **Render.com**.
