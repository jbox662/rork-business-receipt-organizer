# Docs (and Plaid redirect)

This folder is used for **GitHub Pages** so the Plaid redirect page is available at a public https URL.

## Plaid redirect URL

After you enable GitHub Pages (see below), the redirect page will be at:

**https://jbox662.github.io/rork-business-receipt-organizer/plaid/**

Use that exact URL in:
1. **Plaid Dashboard** → Team Settings → Allowed redirect URIs
2. **Firebase:** `firebase functions:config:set plaid.redirect_uri="https://jbox662.github.io/rork-business-receipt-organizer/plaid/"`

## Enable GitHub Pages (one-time)

1. On GitHub: **rork-business-receipt-organizer** → **Settings** → **Pages**
2. Under **Build and deployment**, **Source** = **Deploy from a branch**
3. **Branch** = `main` (or `master`), **Folder** = **/docs** → **Save**
4. Wait a minute or two; the site will be at `https://jbox662.github.io/rork-business-receipt-organizer/`

Then deploy functions: `firebase deploy --only functions`
