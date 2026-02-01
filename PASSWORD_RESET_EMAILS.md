# Password reset emails not arriving (localhost / production)

If "Send reset link" succeeds but no email arrives, try the following.

## 1. Check spam and junk

Firebase sends from `noreply@[your-project].firebaseapp.com`. Many inboxes put this in **spam** or **junk**. Check those folders first.

## 2. Correct email

Use the **exact** email address you used to sign up. If there’s no account for that email, Firebase doesn’t send an email (and the app shows "No account with this email").

## 3. Wait a few minutes

Delivery can take 1–5 minutes. Wait and check again (and spam).

## 4. Firebase Console settings

1. **Firebase Console** → your project → **Authentication** → **Templates**.
2. Open the **Password reset** template.
3. Confirm the sender name and that the template is enabled.
4. (Optional) Use a **custom SMTP** (e.g. SendGrid, Mailgun) if your domain’s email is more reliable than Firebase’s default.

## 5. Authorized domains (for the reset link)

When the user clicks the link in the email, they’re sent to a Firebase page, then redirected back to your app.

1. **Authentication** → **Settings** → **Authorized domains**.
2. Ensure **localhost** is listed for local testing.
3. Add your production domain (e.g. `yourapp.com`) when you deploy.

If your app’s URL isn’t authorized, the reset flow can fail after they click the link.

## 6. Gmail / Google Workspace

If the account is Gmail (or Google Workspace), check:

- **Spam**
- **Promotions** (or other tabs)
- **All Mail**

## 7. Custom action URL (optional)

To send users back to your app (e.g. localhost or your site) after reset:

1. In **Authentication** → **Templates** → **Password reset**, you can set an **Action URL** (or handle this in your app with the link Firebase sends).
2. That URL’s domain must be in **Authorized domains**.

For localhost, use `http://localhost:5173` (or your dev server URL) and add `localhost` as an authorized domain.

---

**Summary:** Most “no email” cases are **spam folder** or **wrong email**. Check those first, then confirm the Firebase password reset template and authorized domains.
