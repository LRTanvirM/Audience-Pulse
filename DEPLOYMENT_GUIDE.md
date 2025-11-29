# Project Setup & Deployment Guide

This guide will walk you through turning your single `App.jsx` file into a fully functional, deployed React application using Vite, Firebase, and GitHub Pages.

## Prerequisites

- **Node.js**: Installed on your computer.
- **GitHub Account**: For hosting the code and the live site.
- **Google Account**: For Firebase.

---

## Part 1: Initialize the Project

Since you currently only have `App.jsx`, we need to scaffold a React project around it.

1.  **Open your terminal** in the folder where `App.jsx` is located.
2.  **Create a Vite project**:
    ```bash
    npm create vite@latest . -- --template react
    ```
    *(Select "Yes" to remove existing files if asked, but **BACKUP App.jsx first** if you haven't already! If you are worried, create a new folder and move App.jsx there first.)*
    
    **Safer Alternative**:
    ```bash
    npm create vite@latest my-audience-app -- --template react
    cd my-audience-app
    ```
    Then move your `App.jsx` into `my-audience-app/src/`.

3.  **Install Dependencies**:
    You need the libraries used in your code:
    ```bash
    npm install firebase lucide-react react-qr-code recharts
    ```

4.  **Replace App.jsx**:
    Replace the default `src/App.jsx` with your `App.jsx` code.

5.  **Clean up CSS**:
    - Clear the contents of `src/App.css` and `src/index.css` (or add Tailwind directives if you want to use Tailwind, see below).
    - **Note**: Your code uses Tailwind CSS classes (e.g., `bg-gradient-to-r`, `text-indigo-600`). You **MUST** set up Tailwind CSS.

6.  **Setup Tailwind CSS** (Required for your styling):
    ```bash
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```
    - Edit `tailwind.config.js`:
      ```javascript
      /** @type {import('tailwindcss').Config} */
      export default {
        content: [
          "./index.html",
          "./src/**/*.{js,ts,jsx,tsx}",
        ],
        theme: {
          extend: {},
        },
        plugins: [],
      }
      ```
    - Add directives to `src/index.css`:
      ```css
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
      ```

---

## Part 2: Firebase Setup (From Scratch)

1.  **Go to Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com/)
2.  **Create a Project**:
    - Click "Add project".
    - Name it (e.g., "Audience-Pulse").
    - Disable Google Analytics (optional, simpler without).
    - Click "Create project".
3.  **Add a Web App**:
    - Click the Web icon (`</>`) on the project overview.
    - Nickname: "Audience App".
    - **Check "Also set up Firebase Hosting"** (Optional, but we are using GitHub Pages, so you can skip this if you prefer. If you want Firebase Hosting, check it. This guide focuses on GitHub Pages).
    - Click "Register app".
4.  **Get Config**:
    - Copy the `firebaseConfig` object shown (apiKey, authDomain, etc.).
    - Paste these values into your `App.jsx` file where it says `// USER MUST FILL THIS IN`.
    - *Better Security*: Create a `.env` file in the root and use environment variables (e.g., `VITE_FIREBASE_API_KEY`), then access them via `import.meta.env.VITE_FIREBASE_API_KEY`.
5.  **Setup Firestore Database**:
    - Go to "Build" -> "Firestore Database" in the sidebar.
    - Click "Create database".
    - Choose a location (e.g., `nam5` or closest to you).
    - **Security Rules**: Start in **Test Mode** (allows read/write for 30 days).
      - *Warning*: For production, you should write rules to allow only valid reads/writes.
      - Example Rule:
        ```
        allow read, write: if true;
        ```

---

## Part 3: GitHub Pages Deployment

1.  **Install `gh-pages`**:
    ```bash
    npm install gh-pages --save-dev
    ```

2.  **Update `vite.config.js`**:
    Add the `base` property with your repository name.
    ```javascript
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'

    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [react()],
      base: '/<YOUR_REPO_NAME>/', // e.g. '/audience-response-app/'
    })
    ```

3.  **Update `package.json`**:
    Add these scripts:
    ```json
    "scripts": {
      // ... existing scripts
      "predeploy": "npm run build",
      "deploy": "gh-pages -d dist"
    }
    ```

4.  **Create GitHub Repository**:
    - Go to GitHub and create a new repository (e.g., `audience-response-app`).
    - Do not initialize with README/gitignore (you have them locally).

5.  **Push Code**:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
    git push -u origin main
    ```

6.  **Deploy**:
    ```bash
    npm run deploy
    ```

7.  **Enable Pages**:
    - Go to Repo Settings -> Pages.
    - Ensure "Source" is set to "Deploy from a branch".
    - The branch should be `gh-pages` (created by the deploy script).
    - Your site will be live at `https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/`.

---

## Troubleshooting

- **Blank Page?** Check `vite.config.js` `base` path matches your repo name exactly.
- **Firebase Errors?** Check console (F12). Ensure Firestore is created and rules allow access.
- **Styling Missing?** Ensure Tailwind is set up and `@tailwind` directives are in `index.css`.
