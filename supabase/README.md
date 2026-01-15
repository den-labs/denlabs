# Supabase CLI Notes

- The Supabase CLI reads `.env.local` for configuration.
- Do **not** use `//` comments in `.env.local`. Many parsers treat those as invalid.
- If you need to disable a variable, delete the line or use `#` for comments.

Recommended pattern:

```bash
# Good comment style
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```
