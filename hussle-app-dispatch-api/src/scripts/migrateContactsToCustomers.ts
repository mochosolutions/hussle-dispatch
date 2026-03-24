#!/usr/bin/env ts-node
/**
 * DEPRECATED: This migration script referenced the old Contact model with
 * brokerId/shipperId FKs and ContactType enum. Those fields have been removed
 * as part of the schema simplification (Customer/Contact split).
 *
 * The migration this script performed is no longer needed — contacts are now
 * person-only records and customers hold company-level data.
 *
 * Keeping this file as a historical reference. Do not run.
 */

const main = (): void => {
  process.stdout.write('This migration script is deprecated and should not be run.\n');
  process.stdout.write('Contact/Customer schema has been simplified.\n');
  process.exitCode = 1;
};

main();
