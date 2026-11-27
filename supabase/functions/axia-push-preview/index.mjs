import pg from "pg";
import webpush from "web-push";
import { createHandler } from "./handler.mjs";

Deno.serve(createHandler({
  env: () => Deno.env.toObject(),
  makeClient: config => new pg.Client({
    connectionString: config.db, ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000, statement_timeout: 5000, query_timeout: 7000,
  }),
  sendNotification: webpush.sendNotification.bind(webpush),
}));
