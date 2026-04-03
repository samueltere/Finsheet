import { financeSeed } from './seed';
import { FinanceWorkspaceState } from './types';

const WORKSPACE_COLLECTION = 'finance_workspaces';
const WORKSPACE_ID = 'primary';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

export async function fetchFinanceWorkspace(): Promise<FinanceWorkspaceState> {
  const response = await fetch(`/api/db/${WORKSPACE_COLLECTION}/${WORKSPACE_ID}`);

  if (response.status === 404) {
    await saveFinanceWorkspace(financeSeed);
    return financeSeed;
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const json = (await response.json()) as { exists: boolean; doc?: FinanceWorkspaceState };
  return json.doc ?? financeSeed;
}

export async function saveFinanceWorkspace(workspace: FinanceWorkspaceState) {
  await request<{ ok: boolean }>(`/api/db/${WORKSPACE_COLLECTION}/${WORKSPACE_ID}`, {
    method: 'PUT',
    body: JSON.stringify(workspace),
  });
}
