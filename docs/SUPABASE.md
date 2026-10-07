# Future Supabase integration boundary

No Supabase SDK, project configuration, auth callbacks, database requests or migrations are included now.

When implemented, add a dedicated browser service module for the Supabase client and separate modules for authentication/session handling and database access. Existing schedule-model and calculator-engine modules stay pure and independent of user sessions. Enable the current Login control only when real sign-in functionality is ready.

Provide deployment-time public configuration for the Supabase project URL and publishable client key. Browser configuration is public by definition: never include a service-role/secret key, database password, Discord token, or private user data in the repository or Pages artifact. GitHub Pages cannot run server-side code or protect secrets; privileged operations require a separate backend such as Supabase Edge Functions.

Before connecting tables, define access rules and Row Level Security policies with appropriate authenticated ownership. Do not rely on hiding UI buttons to protect data. Keep schema migrations version-controlled separately from curated game data.

Choose a real static callback route (for example `auth/callback/index.html`) and configure allowed redirect URLs for both the deployed base path and local development. Reuse the deployment base-path convention for sign-in, logout and links, and test callback refresh and session recovery. Do not add a catch-all redirect that bypasses the existing 404.

Future authentication should not prevent the current public calendar, calculator and album from working unless explicitly requested. Verify actual project settings and current Supabase documentation when implementing; this document is an architectural plan, not an implemented security configuration.
