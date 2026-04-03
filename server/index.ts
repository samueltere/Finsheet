import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

type WhereOp = '==' | '!=' | 'in';
type Direction = 'asc' | 'desc';

interface WhereFilter {
  field: string;
  op: WhereOp;
  value: unknown;
}

interface QueryPayload {
  where?: WhereFilter[];
  orderBy?: { field: string; direction?: Direction } | null;
  limit?: number | null;
}

interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  collection: string;
  id: string;
  data?: Record<string, unknown>;
}

const app = express();
app.use(express.json({ limit: '2mb' }));

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'hotel.sqlite');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (collection, id)
  );
  CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection);
`);

const allowedCollection = /^[a-zA-Z0-9_-]+$/;
const allowedField = /^[a-zA-Z0-9_.-]+$/;

function assertCollection(collection: string) {
  if (!allowedCollection.test(collection)) {
    throw new Error(`Invalid collection name: ${collection}`);
  }
}

function assertField(field: string) {
  if (!allowedField.test(field)) {
    throw new Error(`Invalid field name: ${field}`);
  }
}

function toJsonPath(field: string): string {
  assertField(field);
  return `$.${field}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function parseRow(row: { id: string; data: string }) {
  return {
    id: row.id,
    ...(JSON.parse(row.data) as Record<string, unknown>),
  };
}

function getDoc(collection: string, id: string) {
  return sqlite
    .prepare(`SELECT id, data FROM documents WHERE collection = ? AND id = ?`)
    .get(collection, id) as { id: string; data: string } | undefined;
}

function setDoc(collection: string, id: string, data: Record<string, unknown>) {
  const ts = nowIso();
  sqlite
    .prepare(
      `
      INSERT INTO documents (collection, id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(collection, id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
      `,
    )
    .run(collection, id, JSON.stringify(data), ts, ts);
}

function updateDoc(collection: string, id: string, patch: Record<string, unknown>) {
  const existing = getDoc(collection, id);
  if (!existing) {
    throw new Error(`Document not found: ${collection}/${id}`);
  }
  const merged = {
    ...(JSON.parse(existing.data) as Record<string, unknown>),
    ...patch,
  };
  sqlite
    .prepare(`UPDATE documents SET data = ?, updated_at = ? WHERE collection = ? AND id = ?`)
    .run(JSON.stringify(merged), nowIso(), collection, id);
}

function deleteDoc(collection: string, id: string) {
  sqlite.prepare(`DELETE FROM documents WHERE collection = ? AND id = ?`).run(collection, id);
}

function runQuery(collection: string, payload: QueryPayload) {
  const where = payload.where ?? [];
  const limit = payload.limit ?? null;
  const orderBy = payload.orderBy ?? null;

  const clauses: string[] = ['collection = ?'];
  const params: unknown[] = [collection];

  for (const filter of where) {
    const jsonPath = toJsonPath(filter.field);
    if (filter.op === '==') {
      clauses.push(`json_extract(data, ?) = ?`);
      params.push(jsonPath, filter.value);
    } else if (filter.op === '!=') {
      clauses.push(`json_extract(data, ?) != ?`);
      params.push(jsonPath, filter.value);
    } else if (filter.op === 'in') {
      if (!Array.isArray(filter.value) || filter.value.length === 0) {
        clauses.push(`1 = 0`);
      } else {
        const placeholders = filter.value.map(() => '?').join(', ');
        clauses.push(`json_extract(data, ?) IN (${placeholders})`);
        params.push(jsonPath, ...filter.value);
      }
    }
  }

  let sql = `SELECT id, data FROM documents WHERE ${clauses.join(' AND ')}`;

  if (orderBy) {
    const jsonPath = toJsonPath(orderBy.field);
    const dir = orderBy.direction === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY json_extract(data, ?) ${dir}`;
    params.push(jsonPath);
  }

  if (typeof limit === 'number' && limit > 0) {
    sql += ` LIMIT ?`;
    params.push(Math.floor(limit));
  }

  const rows = sqlite.prepare(sql).all(...params) as { id: string; data: string }[];
  return rows.map(parseRow);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dbPath });
});

app.post('/api/db/:collection/query', (req, res) => {
  try {
    const { collection } = req.params;
    assertCollection(collection);
    const docs = runQuery(collection, req.body ?? {});
    res.json({ docs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

app.get('/api/db/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    assertCollection(collection);
    const row = getDoc(collection, id);
    if (!row) {
      res.status(404).json({ exists: false });
      return;
    }
    res.json({ exists: true, doc: parseRow(row) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

app.post('/api/db/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    assertCollection(collection);
    const id = newId();
    setDoc(collection, id, req.body ?? {});
    res.status(201).json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

app.put('/api/db/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    assertCollection(collection);
    setDoc(collection, id, req.body ?? {});
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

app.patch('/api/db/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    assertCollection(collection);
    updateDoc(collection, id, req.body ?? {});
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

app.delete('/api/db/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    assertCollection(collection);
    deleteDoc(collection, id);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

app.post('/api/db/batch', (req, res) => {
  try {
    const ops = (req.body?.operations ?? []) as BatchOperation[];
    const tx = sqlite.transaction((operations: BatchOperation[]) => {
      for (const op of operations) {
        assertCollection(op.collection);
        if (!op.id) {
          throw new Error(`Batch operation missing id`);
        }
        if (op.type === 'set') {
          setDoc(op.collection, op.id, op.data ?? {});
        } else if (op.type === 'update') {
          updateDoc(op.collection, op.id, op.data ?? {});
        } else if (op.type === 'delete') {
          deleteDoc(op.collection, op.id);
        } else {
          throw new Error(`Invalid batch type`);
        }
      }
    });

    tx(ops);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

const port = Number(process.env.API_PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});
