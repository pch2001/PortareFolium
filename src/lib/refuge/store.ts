import fs from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { REFUGE_DB_PATH, REFUGE_JOURNAL_PATH } from "@/lib/refuge/paths";
import {
    getRefugeIdentity,
    type RefugeJournalEntry,
    type RefugeRow,
} from "@/lib/refuge/schema";

let db: DatabaseSync | null = null;

function ensureParent(filePath: string): void {
    fs.mkdirSync(dirname(filePath), { recursive: true });
}

export function getRefugeDatabase(): DatabaseSync {
    ensureParent(REFUGE_DB_PATH);
    db ??= new DatabaseSync(REFUGE_DB_PATH);
    initializeRefugeDatabase(db);
    return db;
}

export function initializeRefugeDatabase(database: DatabaseSync): void {
    database.exec(`
        CREATE TABLE IF NOT EXISTS refuge_rows (
            table_name TEXT NOT NULL,
            identity TEXT NOT NULL,
            row_json TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (table_name, identity)
        );
        CREATE INDEX IF NOT EXISTS idx_refuge_rows_table_name
            ON refuge_rows(table_name);
    `);
}

export function replaceRefugeTableRows(
    database: DatabaseSync,
    table: string,
    rows: RefugeRow[]
): void {
    const deleteRows = database.prepare(
        "DELETE FROM refuge_rows WHERE table_name = ?"
    );
    const insertRow = database.prepare(`
        INSERT INTO refuge_rows (table_name, identity, row_json, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    database.exec("BEGIN IMMEDIATE");
    try {
        deleteRows.run(table);
        for (const row of rows) {
            const identity = getRefugeIdentity(table, row);
            insertRow.run(table, identity, JSON.stringify(row));
        }
        database.exec("COMMIT");
    } catch (error) {
        database.exec("ROLLBACK");
        throw error;
    }
}

export function listRefugeRows(table: string): RefugeRow[] {
    const database = getRefugeDatabase();
    const rows = database
        .prepare(
            "SELECT row_json FROM refuge_rows WHERE table_name = ? ORDER BY identity"
        )
        .all(table) as { row_json: string }[];
    return rows.map((row) => JSON.parse(row.row_json) as RefugeRow);
}

export function writeRefugeRows(table: string, rows: RefugeRow[]): void {
    const database = getRefugeDatabase();
    replaceRefugeTableRows(database, table, rows);
}

export function appendRefugeJournal(entry: RefugeJournalEntry): void {
    ensureParent(REFUGE_JOURNAL_PATH);
    fs.appendFileSync(
        REFUGE_JOURNAL_PATH,
        `${JSON.stringify(entry)}\n`,
        "utf8"
    );
}

export function readRefugeJournal(): RefugeJournalEntry[] {
    if (!fs.existsSync(REFUGE_JOURNAL_PATH)) return [];
    return fs
        .readFileSync(REFUGE_JOURNAL_PATH, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as RefugeJournalEntry);
}

export function closeRefugeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

export function resetRefugeDatabase(): DatabaseSync {
    closeRefugeDatabase();
    ensureParent(REFUGE_DB_PATH);
    if (fs.existsSync(REFUGE_DB_PATH)) fs.rmSync(REFUGE_DB_PATH);
    const database = getRefugeDatabase();
    return database;
}
