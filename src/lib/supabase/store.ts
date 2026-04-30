/**
 * @deprecated The admin now talks to live Supabase via `./client.ts` and the
 * repository functions in `./repositories/*`. This in-memory mock store was
 * the seed for the live database (see `schema.sql` + the seed migration).
 * Kept here as a reference — safe to delete once you no longer need the seed
 * data on hand. Nothing in the app imports it anymore.
 */
export {};
