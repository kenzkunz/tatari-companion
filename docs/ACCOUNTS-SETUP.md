# Supabase accounts setup

The site supports Google and Discord OAuth only. No email/password signup form is included.

## 1. Database

Open Supabase SQL Editor, create a new query, paste supabase/001_accounts.sql and run it ONCE. It creates private profiles and user_settings tables with ownership policies. Do not disable RLS.

## 2. Supabase URLs

Authentication > URL Configuration:

Site URL: https://kenzkunz.github.io/tatari-companion/

Allowed Redirect URLs:
- https://kenzkunz.github.io/tatari-companion/auth/callback.html
- http://127.0.0.1:4181/tatari-companion/auth/callback.html

Add a different local callback explicitly if the preview port changes. Never use broad production wildcards.

## 3. Google and Discord

Enable Google and Discord in Supabase Authentication > Sign In / Providers. Obtain their OAuth client IDs/secrets from Google Cloud Console and Discord Developer Portal. Enter secrets ONLY in Supabase, never in site code or GitHub.

Both providers' authorized redirect URI:
https://huavqpgfctnjuxurbkgl.supabase.co/auth/v1/callback

For Google use a Web application OAuth client, configure audience/consent and test users while in testing. For Discord create an application, use OAuth2 credentials, add the redirect URI. No bot token is needed.

Official instructions:
https://supabase.com/docs/guides/auth/social-login/auth-google
https://supabase.com/docs/guides/auth/social-login/auth-discord

## 4. Publish and verify

Commit and push; wait for Pages deployment. Open account.html and log in. Save the profile and five dojo levels, reload and verify persistence. In the stats calculator click Use account settings. Log out and verify another account cannot read or update the first account's rows.

Configuration uses only the project URL and publishable key supplied by the owner. Session handling/PKCE/refresh use the bundled official Supabase JS client 2.117.3. Browser sessions persist until local logout. Static public calculators stay available without login.

The SQL has not been applied or executed against the remote project by the assistant. OAuth credentials/provider configuration must be completed in the dashboards. Local checks are not proof of live login, persistence or enforced RLS.

Trading and album ownership tables are deferred to the next milestone. Public profile visibility is also deferred; profiles are private initially.
