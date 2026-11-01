# Sally AI — Google Sheet connection

Google Sheet: https://docs.google.com/spreadsheets/d/15xlMbKBCmX7z2Bk0MKONBA15YRRxhvtiVuoJU9tXigk/edit

**Status:** Sheet created; connection requires owner configuration. No live data is being logged yet.

1. Open the Sheet, select Extensions → Apps Script.
2. Paste `docs/sally-sheet-apps-script.js` into the editor and save.
3. Under Project Settings → Script properties, create `SALLY_LOG_SECRET` with a long random value.
4. Deploy → New deployment → Web app; execute as your Google account; allow web app access to Anyone. The shared secret is validated inside the script. Do not share the deployment URL or secret publicly.
5. In Cloudflare Pages → Settings → Variables and Secrets, set `SALLY_LOG_WEBHOOK_URL` to the deployment URL and `SALLY_LOG_SECRET` to the same secret.
6. Configure `OPENAI_API_KEY` as a Cloudflare secret. Enable server-side rate limiting and budget controls before production.
7. Test an ordinary chat and a consented escalation, then inspect the sheet. No full transcripts or pasted event logs should appear.
8. Update RowPulser privacy policy and retention schedule before launch.

**Escalation policy:** Ask permission to share details with the RowPulser development team, explicitly show the issue summary, ask for and confirm email, and only then set Escalated=Yes. Email confirmation in chat is not proof of mailbox ownership. The user must be able to decline.

**Important:** Google Apps Script webhook responses are not a robust authentication mechanism. Use a stronger Google service-account or authenticated API gateway for a production-grade client solution.
