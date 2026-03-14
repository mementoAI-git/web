# How to get GitHub push notifications in Discord

Follow these steps once. After that, every push to `dev` or `main` will post a message in your Discord channel.

---

## Step 1: Create a Discord webhook

1. Open **Discord** (app or browser).
2. Go to the **channel** where you want the notifications (e.g. `#dev-updates`).
3. Click the **gear icon** next to the channel name (Channel settings).
4. In the left sidebar, click **Integrations**.
5. Click **Webhooks** → **New Webhook** (or **Create Webhook**).
6. Give it a name (e.g. "GitHub").
7. Click **Copy Webhook URL**.  
   The URL looks like: `https://discord.com/api/webhooks/1234567890/abcdef...`  
   Keep this URL private; anyone with it can post to your channel.

---

## Step 2: Add the webhook URL as a secret in GitHub

1. Open your repo in the browser: **https://github.com/mementoAI-git/web**
2. Click **Settings** (top tab bar of the repo).
3. In the left sidebar, click **Secrets and variables** → **Actions**.
4. Click **New repository secret**.
5. **Name:** type exactly: `DISCORD_WEBHOOK_URL`  
   **Secret:** paste the Discord webhook URL you copied in Step 1.
6. Click **Add secret**.

---

## Step 3: Commit and push the workflow file

The workflow file is already in your project at:

**`.github/workflows/discord-notify.yml`**

To turn it on:

1. Commit this file (and the rest of your changes if any).
2. Push to `dev` or `main`.

From the project folder in a terminal:

```bash
git add .github/workflows/discord-notify.yml
git commit -m "Add Discord notification on push to dev/main"
git push origin dev
```

(Use `main` instead of `dev` if you want to push to main.)

---

## Done

After the next push to `dev` or `main`, GitHub Actions will run and send a message to your Discord channel. You can see runs under: **Actions** tab in the repo.

---

## Troubleshooting: No notifications in Discord

### 1. Check if the workflow runs

1. Go to **https://github.com/mementoAI-git/web** → **Actions** tab.
2. Look for **"Notify Discord on push"** in the left sidebar.
3. Click it and check the latest runs. Do you see runs for your recent pushes?

- **No runs at all** → The workflow might be disabled or the push didn’t trigger it. Ensure you pushed to `dev` or `main` (not another branch).
- **Runs exist** → Go to step 2.

### 2. Check if the workflow succeeds or fails

Open the latest run and look at the steps:

- **"Check Discord webhook secret"** fails with "DISCORD_WEBHOOK_URL secret is not set"  
  → Add the secret: **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → Name: `DISCORD_WEBHOOK_URL`, Value: your webhook URL.

- **"Send message to Discord"** fails with "Discord webhook failed (HTTP 404)"  
  → The webhook URL is invalid or was deleted. Create a new webhook in Discord and update the secret.

- **"Send message to Discord"** fails with "Discord webhook failed (HTTP 4xx)"  
  → Check the error body in the logs. Discord may reject the payload (e.g. invalid format).

- **All steps succeed** but no message in Discord  
  → You may be looking in the wrong channel. The webhook posts only to the channel where it was created. Check that channel’s **Integrations** → **Webhooks** to confirm.

### 3. Verify the webhook URL

- Format: `https://discord.com/api/webhooks/1234567890/abcdef...` (no trailing slash).
- Create a new webhook in Discord if unsure, then update the `DISCORD_WEBHOOK_URL` secret.
