#!/usr/bin/env node
/**
 * RANDOO ARCADE — DATABASE RESET UTILITY
 * Resets the arcade database (both PostgreSQL and local encrypted store).
 * Clears all accounts, sessions, and stale stats, ensuring 0 bots and a clean slate.
 */

const { configuredDatabase } = require('../shared-database');
const EncryptedArcadeDB = require('../database');

async function resetArcadeDatabase() {
  console.log('----------------------------------------------------');
  console.log('⚡ RANDOO ARCADE — DATABASE RESET INITIATED');
  console.log('----------------------------------------------------');

  // 1. Reset Local Encrypted File Store
  const localDb = new EncryptedArcadeDB();
  localDb.reset();
  console.log('✓ Local encrypted database reset successfully (0 users, 0 bots).');

  // 2. Reset PostgreSQL Database (if configured)
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (connectionString) {
    try {
      console.log('⚡ Connecting to shared PostgreSQL database...');
      const db = configuredDatabase();
      await db.reset();
      console.log('✓ PostgreSQL shared database reset successfully.');
    } catch (err) {
      console.error('✗ Failed to reset PostgreSQL database:', err.message);
      process.exit(1);
    }
  } else {
    console.log('ℹ PostgreSQL is not configured (DATABASE_URL / POSTGRES_URL not set).');
    console.log('  Only the local encrypted database file was reset.');
    console.log('  To connect PostgreSQL, set DATABASE_URL in your .env or environment.');
  }

  console.log('----------------------------------------------------');
  console.log('✓ DATABASE RESET COMPLETE! Real users only, no bots.');
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  resetArcadeDatabase().catch(err => {
    console.error('Fatal error during database reset:', err);
    process.exit(1);
  });
}

module.exports = { resetArcadeDatabase };
