# Gmail Unread Viewer (PWA)

A simple Progressive Web App to view unread Gmail messages securely on your phone.

## Setup

1.  **Deploy to GitHub Pages**:
    - Push this repository to GitHub.
    - Go to Settings > Pages.
    - Select the branch (e.g., `main`) and folder (`/` or `/docs` if applicable) and Save.

2.  **Configure Google Cloud Console**:
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Select your project.
    - Go to **APIs & Services > Credentials**.
    - Create/Edit an OAuth 2.0 Client ID (Web application).
    - Add your GitHub Pages URL (e.g., `https://yourname.github.io`) to **Authorized JavaScript origins**.
    - Note your **Client ID**.

3.  **Usage**:
    - Open the deployed URL on your phone.
    - Click "Sign in with Google".
    - Enter your Client ID when prompted (first time only).
    - Add to Home Screen to install as an app.

## Local Development

Run `server.ps1` with PowerShell to start a local server at `http://localhost:8080`.
Make sure to add `http://localhost:8080` to Authorized JavaScript origins for local testing.
