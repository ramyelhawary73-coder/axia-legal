import pg from "pg";
import webpush from "web-push";
import { createHandler } from "./handler.mjs";
import { createReadinessHandler } from "./readiness.mjs";

const sender = createHandler({
  env: () => Deno.env.toObject(),
  makeClient: config => new pg.Client({
    connectionString: config.db, ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000, statement_timeout: 5000, query_timeout: 7000,
  }),
  sendNotification: webpush.sendNotification.bind(webpush),
});
const readiness = createReadinessHandler({
  env: () => Deno.env.toObject(), makeClient: options => new pg.Client(options),
});
// Any purpose header stays on the fail-closed diagnostic branch, including typos.
Deno.serve(request => request.headers.has("x-axia-push-purpose") ? readiness(request) : sender(request));
