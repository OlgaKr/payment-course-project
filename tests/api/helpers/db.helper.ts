import { Client } from 'pg';

export function createDbClient() {
  return new Client({
    host: 'localhost',
    port: 5433,
    database: 'payments_db',
    user: 'payments',
    password: 'payments',
  });
}
