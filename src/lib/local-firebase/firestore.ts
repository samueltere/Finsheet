import type { LocalApp } from './app';

type Direction = 'asc' | 'desc';
type WhereOp = '==' | '!=' | 'in';

type WhereConstraint = {
  type: 'where';
  field: string;
  op: WhereOp;
  value: unknown;
};

type OrderByConstraint = {
  type: 'orderBy';
  field: string;
  direction: Direction;
};

type LimitConstraint = {
  type: 'limit';
  count: number;
};

type Constraint = WhereConstraint | OrderByConstraint | LimitConstraint;

type DbRef = {
  type: 'db';
};

type CollectionRef = {
  type: 'collection';
  collection: string;
};

type DocumentRef = {
  type: 'doc';
  collection: string;
  id: string;
};

type QueryRef = {
  type: 'query';
  collection: string;
  constraints: Constraint[];
};

type SnapshotDoc<T = Record<string, unknown>> = {
  id: string;
  data: () => T;
};

type QuerySnapshot<T = Record<string, unknown>> = {
  docs: SnapshotDoc<T>[];
};

type DocSnapshot<T = Record<string, unknown>> = {
  id: string;
  exists: () => boolean;
  data: () => T;
};

const POLL_MS = 2500;
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 14);
}

function makeQueryPayload(target: CollectionRef | QueryRef) {
  const constraints = target.type === 'query' ? target.constraints : [];

  const where = constraints
    .filter((c): c is WhereConstraint => c.type === 'where')
    .map(c => ({ field: c.field, op: c.op, value: c.value }));

  const order = constraints.find((c): c is OrderByConstraint => c.type === 'orderBy');
  const lim = constraints.find((c): c is LimitConstraint => c.type === 'limit');

  return {
    where,
    orderBy: order ? { field: order.field, direction: order.direction } : null,
    limit: lim ? lim.count : null,
  };
}

function toQuerySnapshot(docs: Record<string, unknown>[]): QuerySnapshot {
  return {
    docs: docs.map(row => {
      const { id, ...data } = row;
      return {
        id: String(id),
        data: () => data,
      };
    }),
  };
}

async function fetchQuery(target: CollectionRef | QueryRef): Promise<QuerySnapshot> {
  const collectionName = target.collection;
  const payload = makeQueryPayload(target);
  const res = await fetch(apiUrl(`/api/db/${collectionName}/query`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const json = await res.json();
  return toQuerySnapshot(json.docs ?? []);
}

export function getFirestore(_app?: LocalApp, _databaseId?: string): DbRef {
  return { type: 'db' };
}

export function collection(_db: DbRef, collectionName: string): CollectionRef {
  return { type: 'collection', collection: collectionName };
}

export function doc(arg1: DbRef | CollectionRef, collectionOrId?: string, maybeId?: string): DocumentRef {
  if ((arg1 as CollectionRef).type === 'collection') {
    const col = arg1 as CollectionRef;
    return {
      type: 'doc',
      collection: col.collection,
      id: collectionOrId ?? makeId(),
    };
  }
  return {
    type: 'doc',
    collection: String(collectionOrId),
    id: String(maybeId),
  };
}

export async function getDoc<T = Record<string, unknown>>(ref: DocumentRef): Promise<DocSnapshot<T>> {
  const res = await fetch(apiUrl(`/api/db/${ref.collection}/${ref.id}`));
  if (res.status === 404) {
    return {
      id: ref.id,
      exists: () => false,
      data: () => ({} as T),
    };
  }
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const json = await res.json();
  const raw = (json.doc ?? {}) as Record<string, unknown>;
  const { id, ...data } = raw;

  return {
    id: String(id ?? ref.id),
    exists: () => true,
    data: () => data as T,
  };
}

export async function getDocFromServer<T = Record<string, unknown>>(ref: DocumentRef) {
  return getDoc<T>(ref);
}

export async function setDoc(ref: DocumentRef, data: Record<string, unknown>) {
  const res = await fetch(apiUrl(`/api/db/${ref.collection}/${ref.id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

export async function updateDoc(ref: DocumentRef, data: Record<string, unknown>) {
  const res = await fetch(apiUrl(`/api/db/${ref.collection}/${ref.id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

export async function addDoc(ref: CollectionRef, data: Record<string, unknown>) {
  const res = await fetch(apiUrl(`/api/db/${ref.collection}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const json = await res.json();
  return { type: 'doc', collection: ref.collection, id: String(json.id) } as DocumentRef;
}

export async function deleteDoc(ref: DocumentRef) {
  const res = await fetch(apiUrl(`/api/db/${ref.collection}/${ref.id}`), {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

export function where(field: string, op: WhereOp, value: unknown): WhereConstraint {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: Direction = 'asc'): OrderByConstraint {
  return { type: 'orderBy', field, direction };
}

export function limit(count: number): LimitConstraint {
  return { type: 'limit', count };
}

export function query(base: CollectionRef, ...constraints: Constraint[]): QueryRef {
  return { type: 'query', collection: base.collection, constraints };
}

export async function getDocs(target: CollectionRef | QueryRef): Promise<QuerySnapshot> {
  return fetchQuery(target);
}

export function onSnapshot(
  target: CollectionRef | QueryRef,
  onNext: (snapshot: QuerySnapshot) => void,
  onError?: (error: unknown) => void,
) {
  let isActive = true;

  const tick = async () => {
    try {
      const snapshot = await fetchQuery(target);
      if (isActive) {
        onNext(snapshot);
      }
    } catch (error) {
      if (isActive && onError) {
        onError(error);
      }
    }
  };

  void tick();
  const timer = window.setInterval(() => void tick(), POLL_MS);

  return () => {
    isActive = false;
    window.clearInterval(timer);
  };
}

export function writeBatch(_db: DbRef) {
  const operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    id: string;
    data?: Record<string, unknown>;
  }> = [];

  return {
    set(ref: DocumentRef, data: Record<string, unknown>) {
      operations.push({ type: 'set', collection: ref.collection, id: ref.id, data });
    },
    update(ref: DocumentRef, data: Record<string, unknown>) {
      operations.push({ type: 'update', collection: ref.collection, id: ref.id, data });
    },
    delete(ref: DocumentRef) {
      operations.push({ type: 'delete', collection: ref.collection, id: ref.id });
    },
    async commit() {
      const res = await fetch(apiUrl('/api/db/batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    },
  };
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}
