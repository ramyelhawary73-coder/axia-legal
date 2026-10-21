import { randomBytes } from "node:crypto";
import { OFFICE_TABLES, verifyOfficeSnapshot } from "../../src/lib/office-backup.ts";

// Verification/staging ONLY. No Supabase URL, password, token, Auth API or live restore.
// The caller must create an EMPTY disposable database and its private nonce marker.
export async function restoreOfficeSnapshot(db, snapshot, nonce) {
  const report = await verifyOfficeSnapshot(snapshot);
  const marker = await db.query("select nonce from private.axia_restore_disposable");
  if (marker.rows.length !== 1 || marker.rows[0].nonce !== nonce) throw new Error("RESTORE_DISPOSABLE_MARKER_REQUIRED");
  for (const table of OFFICE_TABLES) {
    if (Number((await db.query(`select count(*) n from public.${table}`)).rows[0].n)) throw new Error("RESTORE_REQUIRES_EMPTY_DATABASE");
  }
  const users = new Set();
  const userColumns = new Set(["created_by", "user_id", "actor_id", "assigned_to", "attending_user_id", "requested_by", "approved_by", "accepted_by"]);
  for (const [table, rows] of Object.entries(snapshot.tables)) for (const row of rows) {
    if (table === "profiles") users.add(row.id);
    for (const [key, value] of Object.entries(row)) if (userColumns.has(key) && value) users.add(value);
  }
  const owner = snapshot.tables.organization_members.find(r => r.role === "owner")?.user_id;
  if (!owner) throw new Error("RESTORE_OWNER_REFERENCE_REQUIRED");
  let quarantinedInvitations = 0, quarantinedActions = 0;
  await db.transaction(async tx => {
    // These are disabled local FK placeholders, never usable hosted Auth accounts.
    for (const id of users) await tx.query("insert into auth.users(id,email,is_anonymous,email_confirmed_at) values($1,null,true,null)",[id]);
    await tx.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:owner,aal:"aal1"})]);
    for (const table of OFFICE_TABLES) {
      const catalog = (await tx.query("select column_name,udt_name from information_schema.columns where table_schema='public' and table_name=$1",[table])).rows;
      const columns = new Map(catalog.map(c => [c.column_name,c.udt_name]));
      for (const original of snapshot.tables[table]) {
        const row = {...original};
        if (table === "staff_invitations") {
          row.token_hash = randomBytes(32).toString("hex");
          if (row.status === "pending") {row.status="revoked";row.accepted_by=null;row.accepted_at=null;quarantinedInvitations++;}
        }
        if (table === "rajih_action_requests" && ["proposed","approved"].includes(row.status)) {row.status="rejected";quarantinedActions++;}
        const keys = Object.keys(row);
        if (!keys.length || keys.some(k => !columns.has(k) || !/^[a-z_]+$/.test(k))) throw new Error("RESTORE_SCHEMA_MISMATCH");
        const values = keys.map(k => columns.get(k)==="jsonb" ? JSON.stringify(row[k]) : row[k]);
        await tx.query(`insert into public.${table}(${keys.map(k=>`"${k}"`).join(",")}) values(${keys.map((_,i)=>`$${i+1}`).join(",")})`,values);
      }
    }
    await tx.exec("create table private.restored_file_bytes(path text primary key,sha256 text not null,bytes bytea not null)");
    for (const file of snapshot.files) {
      await tx.query("insert into private.restored_file_bytes values($1,$2,$3)",[file.path,file.sha256,Buffer.from(file.base64,"base64")]);
      await tx.query("insert into storage.objects(bucket_id,name,metadata) values('legal-documents',$1,$2)",[file.path,JSON.stringify({size:file.size})]);
    }
  });
  const counts={};
  for (const table of OFFICE_TABLES) {
    counts[table]=Number((await db.query(`select count(*) n from public.${table}`)).rows[0].n);
    if(counts[table]!==snapshot.tables[table].length)throw new Error("RESTORE_ROW_COUNT_MISMATCH");
  }
  if (Number((await db.query("select count(*) n from private.platform_principals")).rows[0].n)!==0) throw new Error("RESTORE_MUST_NOT_GRANT_PLATFORM_AUTHORITY");
  return {...report,counts,quarantinedInvitations,quarantinedActions};
}
