# Shared accounts and leaderboard

Vercel function files and memory are private to each instance. The encrypted file
in this repository is suitable for a single local Node server, not a shared
production database. Git pushes do not collect users created in running functions.

For Vercel, connect a PostgreSQL database (for example Neon through the Vercel
Marketplace) to the project. Enable its `DATABASE_URL` or `POSTGRES_URL` environment
variable for Production, retain the existing `DB_SECRET_KEY` and `DB_SALT`, and
redeploy. Use a separate database for Preview if previews should be isolated.
Never commit connection strings or encryption secrets.

The application creates `randoo_store` automatically. Its encrypted payload holds
accounts, password hashes, sessions and scores. Transactions lock the row before
updates so separate instances cannot overwrite each other's registrations or
scores. Keep the encryption key and salt stable across deployments. A wrong key
fails the request rather than resetting the shared database.

This is a small-arcade storage design: writes serialize on one encrypted row.
If the player base grows substantially, migrate to individual user/session rows.

The shared database starts empty. Existing accounts scattered across temporary
Vercel instances or browser-only vaults are not automatically imported; players
need to register in the shared store. Local development without a connection
string still uses `data/arcade_database.enc`. Vercel without a connection string
returns an unavailable response instead of creating another isolated database.

Online authentication and rankings never fall back to browser-only accounts.
Offline `file://` play retains its local vault. Dice and Reaction remain playable,
but only RPS, Tic-Tac-Toe, Number Guesser and Hangman count toward ranked statistics.

Run `npm test` to check the SQL storage flow with an embedded PostgreSQL engine,
independent application instances, concurrent account updates and ranked totals.

## Database Reset & Bot Policy
- To reset both local and shared PostgreSQL databases to a completely clean slate, run:
  ```bash
  npm run reset-db
  ```
- Bots and dummy accounts are strictly excluded from all leaderboard queries and user counts.
- Places 1, 2, and 3 in the leaderboard display champion cup emojis (🥇, 🥈, 🥉) without rank numbers.

