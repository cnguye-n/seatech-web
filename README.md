# seatech-web
Senior Capstone Project

## SEAtech Web — Dev Setup
### Prerequisites
- **Git**
- **Node Version Manager (NVM)**
  - Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
  - macOS/Linux: `brew install nvm` (or follow nvm repo instructions)
- **Node.js:** v20.19.2 (LTS)

---

## Project Setup (Frontend Only)

### 1. Clone the repo
```bash
git clone https://github.com/cnguye-n/seatech-web.git
cd seatech-web
```

### 2. Install Node.js LTS or use the right Node version (20.19.2)
- Go to [https://nodejs.org/en/download](https://nodejs.org/en/download)
- Download and choose v20.19.2
- Choose the **LTS version** (recommended for stability). LTS stands for long term support
- Node.js comes with **npm** pre-installed.
- Verify installation:
```bash
  node -v
  npm -v
```

-if you already have node.js you can do
```bash
nvm install 20.19.2
nvm use 20.19.2
```

node -v should have v20.19.2
npm -v should have 10.8.x or any compatible (I have 10.8.2 but you can have like 10.8.5)

### 3. Install Concurrently (at root level)
Note: concurrently allows you to run both the frontend and backend servers at the same time with a single command instead of opening two terminals.

Install it in the root folder:
```bash
npm install concurrently --save-dev
```

Then make sure your package.json IN THE ROOT FOLDER has this inside:
```bash
{
  "name": "seatech-web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\"",
    "frontend": "npm run dev --prefix frontend",
    "backend": "npm run dev --prefix backend"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

What this means:
--prefix frontend → runs the frontend React app inside the /frontend folder
--prefix backend → runs the backend Flask or Node API inside the /backend folder
Both start together when you type npm run dev


### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
```
NOTE: do not run npm create vite... (the frontend/ app already exists in the repo)


### INSTRUCTIONS FOR RUNNING
From the root, type the command below to run the app
```bash
npm run dev 
``` 
This will:
Start the frontend (Vite React app) on http://localhost:5173
Start the backend (Flask or Node API) on http://localhost:5000

### Common Commands
**Run both frontend and backend concurrently**
```bash
npm run dev
```
**Run only the frontend**
```bash
npm run frontend
```
**Run only the backend**
```bash
npm run backend
```
**Build production-ready frontend**
```bash
cd frontend && npm run build
```



