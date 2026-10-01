# OLM Volunteer Auditor 🔄

An administrative reconciliation application designed for **Our Lady of Mercy School** to track event attendance. It cross-references expected volunteer sign-ups from the **SignUpGenius V2 API** against actual check-in data logged in a **Google Spreadsheet ledger** by the OLM Volunteer Hub app. 

It instantly isolates missing parent volunteers (**No-Shows**) and saves the resulting roster into a separate Google Spreadsheet of your choice.

---

## ✨ Features

- **Smart URL Parsing:** Administrators can copy-paste full, raw web addresses straight from the browser bar for SignUpGenius and Google Sheets; the application automatically extracts the unique parameter keys on the fly.
- **Dynamic Input Configuration:** Reusable for any school event—no hardcoded event keys or spreadsheet IDs required.
- **Automated Spreadsheet Structure:** Dynamically verifies the destination spreadsheet and writes clean `Email`, `Name`, and `Role` column headers if the sheet is fresh or empty.
- **Live Local Dashboard:** Displays identified missing volunteers directly on-screen before and during spreadsheet writing sequences.

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Lucide Icons
- **APIs:** SignUpGenius Core API v2 & Google Sheets API v4

---

## 📂 Project Structure

```text
olm-volunteer-auditor/
├── app/
│   ├── api/
│   │   └── reconcile/
│   │       └── route.ts     # The automated data matching backend engine
│   ├── layout.tsx           # Global app layout configuration
│   └── page.tsx             # The main visual utility page
├── components/
│   └── AuditorForm.tsx      # The dynamic interaction input interface form
└── .env.local               # Secret vault for your local API credentials
```

---

## 🔐 Setup Credentials & Environment Configuration

Create a file named `.env.local` in the root project directory and plug in your verified administrative credentials:

```env
# SignUpGenius Core Access Key
SIGNUPGENIUS_API_KEY=your_signupgenius_key_here

# Google Cloud Platform Identity Robot Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-auditor@://gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Important Private Key Formatting Note:** The `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` block must be completely wrapped inside double quotation marks (`""`) and configured to occupy one continuous line in your editor, retaining the explicit `\n` row split elements.

### 🤖 Google Cloud Permission Step
For this auditor tool to read your source log files and modify your output roster targets, you must share your event Google Sheets explicitly. Open your spreadsheets in the browser, click the blue **Share** button, and add your `GOOGLE_SERVICE_ACCOUNT_EMAIL` address as an **Editor**.

---

## 🚀 Running Locally

1. Install the workspace dependencies:
   ```bash
   npm install
   ```

2. Fire up the local Next.js development compilation runner:
   ```bash
   npm run dev
   ```

3. Open your browser environment and navigate to:
   ```text
   http://localhost:3000
   ```

---

## ☁️ Production Deployment (Vercel)

This application is engineered to deploy instantly onto Vercel serverless functions:

1. Push your final code tree up to a private repository in your **GitHub** account.
2. Log into the Vercel Dashboard and click **Add New Project**.
3. Import your `olm-volunteer-auditor` codebase repository.
4. Expand the **Environment Variables** panel and add your three configuration secrets exactly matching your `.env.local` designations:
   - `SIGNUPGENIUS_API_KEY`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
5. Click **Deploy**. Your reusable administrative hub tools are now ready to go live for your staff!
