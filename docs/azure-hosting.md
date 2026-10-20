# Hosting on Azure Static Web Apps

> **Plain-language guide for a student project.**
> Live deployment is not required for PS09. This document explains how you *would* host it if needed.

---

## What is Azure Static Web Apps?

Azure Static Web Apps is a free hosting service for apps that are just HTML, CSS, and JavaScript files — exactly what Vite outputs. It connects directly to your GitHub repository and re-deploys automatically every time you push a commit.

---

## How the Vite Build Works

When you run `npm run build`, Vite compiles your React components into a `dist/` folder:

```
dist/
  index.html
  assets/
    index-<hash>.js
    index-<hash>.css
```

This `dist/` folder is what you upload to Azure.

---

## Architecture Overview

```mermaid
flowchart LR
  Dev["Developer\n(local machine)"]
  GH["GitHub Repository"]
  GA["GitHub Actions CI\n(runs tests + build)"]
  AZ["Azure Static Web Apps\n(serves dist/ folder)"]
  Browser["User's Browser"]

  Dev -->|git push| GH
  GH -->|triggers workflow| GA
  GA -->|on success, deploys dist/| AZ
  AZ -->|serves static files| Browser
  Browser -->|localStorage only\n(no server)| Browser
```

> **No backend, no database.** All game results stay in the player's own browser via `localStorage`. No personal data ever leaves their device.

---

## Step-by-Step Deployment

### 1. Create a GitHub repository

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<your-username>/memory-matching.git
git push -u origin main
```

### 2. Create a Static Web App in Azure

1. Go to [portal.azure.com](https://portal.azure.com) → **Create a resource** → search **Static Web App**.
2. Fill in:
   | Field | Value |
   |---|---|
   | Subscription | Your subscription |
   | Resource Group | Create new: `rg-memory-matching` |
   | Name | `memory-matching-ps09` |
   | Plan type | **Free** |
   | Region | East US (or closest to you) |
   | Source | **GitHub** |
   | Repository | `<your-username>/memory-matching` |
   | Branch | `main` |
   | Build preset | **Vite** |
   | App location | `/` |
   | Output location | `dist` |

3. Click **Review + create** → **Create**.

Azure automatically adds a GitHub Actions workflow file to your repository. When the workflow runs, it builds and deploys your app.

### 3. The auto-generated workflow

Azure adds `.github/workflows/azure-static-web-apps-<random>.yml`. It looks roughly like this:

```yaml
- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    app_location: "/"
    output_location: "dist"
```

You can combine this with your existing CI tests by running Vitest first and only deploying if tests pass.

---

## Custom Domain and HTTPS

1. In the Azure portal, open your Static Web App → **Custom domains** → **Add**.
2. Enter your domain (e.g. `memory.example.com`).
3. Azure gives you a `CNAME` record to add in your DNS provider's settings.
4. **HTTPS is automatic** — Azure manages the TLS certificate for you via Let's Encrypt. No manual certificate setup is needed.

---

## Optional: Application Insights

Application Insights lets you see page views, errors, and performance without storing personal data.

1. Create an **Application Insights** resource in Azure.
2. Copy the **Connection String**.
3. Add the SDK to `index.html`:

```html
<script type="module">
  import { ApplicationInsights } from '@microsoft/applicationinsights-web';
  const ai = new ApplicationInsights({
    config: { connectionString: 'YOUR_CONNECTION_STRING' }
  });
  ai.loadAppInsights();
  ai.trackPageView();
</script>
```

4. This only tracks anonymous events (page loads, JS errors) — no game data or personal information is sent.

---

## Privacy Note

This app stores results **only in the player's browser** (`localStorage`). No names, no email addresses, no personal data. If a player clears their browser data, the history disappears. Azure receives no game data at all — it only serves the static files.

---

## Estimated Cost

| Resource | Cost |
|---|---|
| Azure Static Web Apps (Free tier) | \$0 / month |
| Custom domain (if you already own it) | \$0 |
| Application Insights (first 5 GB/month) | \$0 |

The entire setup is **free** for a student project.
