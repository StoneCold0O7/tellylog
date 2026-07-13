# CHECKLIST v2.7.8, turning on analytics and reading it

Deploy is a `git push` to main (Vercel auto-builds). The code is live once the build is green, but analytics collects NOTHING until you enable Web Analytics in the dashboard. Do that first.

## 1. Enable it (one time, ~1 minute)

- [ ] Go to vercel.com and log in with the account that owns tellylog.
- [ ] Open the **tellylog** project.
- [ ] Click the **Analytics** tab.
- [ ] Click **Enable** for Web Analytics.

## 2. Confirm data is flowing

- [ ] Open tellylog-3d2u.vercel.app and click around a few tabs.
- [ ] Back in the Analytics tab, within ~30 seconds you should see Visitors and Page Views tick up.
- [ ] Open the **Referrers** panel: this is where LinkedIn traffic shows up, so you can see how many came from your post.

## 3. Confirm the engagement events

- [ ] In the Analytics **Events** view, after you (or a visitor) do these, the matching event should appear:
  - Add a show or film from Explore or search: `title_added`
  - Open the Explore tab: `explore_opened`
  - Ask the AI "what to watch": `ai_ask`
  - Tap the "How to add this app to your phone" tag: `install_help_opened`

## 4. Sanity

- [ ] The Profile fineprint and the Manage-your-data modal now read "Your watch history is stored in this browser only and is never uploaded. TellyLog counts anonymous visits with cookie-free analytics..." (the old "Nothing is uploaded anywhere" line is gone).
- [ ] Everything else works as before; no visible change to the app itself.

Note: before you click Enable, the app quietly asks Vercel for an analytics script that does not exist yet, which shows as a harmless 404 in browser dev tools. It disappears the moment you enable. Nothing to fix.
