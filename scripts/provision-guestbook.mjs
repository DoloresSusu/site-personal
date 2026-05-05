import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sqlPath = path.join(root, "supabase", "guestbook.sql");
const configPath = path.join(root, "assets", "guestbook-config.js");

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!accessToken || !projectRef || !supabaseUrl || !anonKey) {
    console.error([
        "Missing required env vars.",
        "Required: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_URL, SUPABASE_ANON_KEY",
        "This script writes only the public anon key to assets/guestbook-config.js."
    ].join("\n"));
    process.exit(1);
}

const sql = await fs.readFile(sqlPath, "utf8");

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: sql })
});

if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase schema provisioning failed: ${response.status}\n${body}`);
}

const config = `window.DOLO_GUESTBOOK_CONFIG = {
    supabaseUrl: ${JSON.stringify(supabaseUrl.replace(/\/$/, ""))},
    supabaseAnonKey: ${JSON.stringify(anonKey)},
    table: "guestbook_messages",
    limit: 12
};
`;

await fs.writeFile(configPath, config, "utf8");
console.log("Guestbook table is ready and assets/guestbook-config.js has been updated.");
