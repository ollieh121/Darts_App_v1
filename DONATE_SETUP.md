# Connecting the QR code to your donation link (Version 7)

The live score page shows a **Scan to donate** section with your QR code image and a **Donate now** button. To make both open your real donation page, do the following.

## 1. Set the donation URL (required for interactive link)

The QR image is already on the page. To make the **Donate now** button and the **QR code (when clicked)** go to your donation page:

### Local development

In your project root, create or edit **`.env.local`** and add:

```env
NEXT_PUBLIC_DONATE_URL="https://your-actual-donation-page.com"
```

Use your real donation URL, for example:

- JustGiving: `https://www.justgiving.com/fundraising/your-page`
- Virgin Money Giving: `https://uk.virginmoneygiving.com/...`
- Or any other fundraising/donation URL you use

Restart the dev server after changing env vars:

```bash
npm run dev
```

### Production (e.g. Vercel)

1. Open your project on [Vercel](https://vercel.com) → **Settings** → **Environment Variables**.
2. Add a variable:
   - **Name:** `NEXT_PUBLIC_DONATE_URL`
   - **Value:** your full donation URL (e.g. `https://www.justgiving.com/fundraising/your-page`)
3. Redeploy the app so the new variable is used.

## 2. What happens once the URL is set

- **Donate now** button → opens your donation page in a new tab.
- **QR code** → when users **click** it on the live score page, it also opens the same donation page.
- When users **scan** the QR with their phone, they go to whatever URL is encoded in that QR image. If your QR was generated for the same donation URL, scanning will also open the donation page.

## 3. If you need to change the QR image

The app uses the image at **`public/scan-to-donate-qr.png`**. To use a different QR:

1. Replace the file `public/scan-to-donate-qr.png` with your new image (same filename), or  
2. Generate a new QR for your donation URL (e.g. via [qrserver.com](https://goqr.me/) or similar), save it as `public/scan-to-donate-qr.png`, and redeploy.

## 4. Summary checklist

| Step | Action |
|------|--------|
| 1 | Set `NEXT_PUBLIC_DONATE_URL` in `.env.local` (local) or in Vercel Environment Variables (production). |
| 2 | Use your real donation page URL as the value. |
| 3 | Restart dev server or redeploy so the variable is picked up. |
| 4 | Optional: ensure your QR image (`public/scan-to-donate-qr.png`) was generated for that same URL so scanning also works. |

No code changes are required—only the environment variable and, if you like, the QR image file.
