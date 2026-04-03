type ProviderData = {
  providerId: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export type LocalUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: ProviderData[];
};

type AuthListener = (user: LocalUser | null) => void;

export type LocalAuth = {
  currentUser: LocalUser | null;
};

const STORAGE_KEY = 'elitiro.local.auth.user';
const listeners = new Set<AuthListener>();

const authState: LocalAuth = {
  currentUser: loadUser(),
};

function loadUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: LocalUser | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function emit() {
  for (const cb of listeners) {
    cb(authState.currentUser);
  }
}

export class GoogleAuthProvider {}

export function getAuth(): LocalAuth {
  return authState;
}

export async function signInWithPopup(_auth: LocalAuth, _provider: GoogleAuthProvider) {
  const existing = authState.currentUser;
  if (existing) {
    return { user: existing };
  }

  const user: LocalUser = {
    uid: `local_${Math.random().toString(36).slice(2, 12)}`,
    email: 'owner@local.hotel',
    displayName: 'Hotel Owner',
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: [
      {
        providerId: 'local',
        displayName: 'Hotel Owner',
        email: 'owner@local.hotel',
        photoURL: null,
      },
    ],
  };

  authState.currentUser = user;
  persistUser(user);
  emit();

  return { user };
}

export function onAuthStateChanged(_auth: LocalAuth, callback: AuthListener) {
  listeners.add(callback);
  callback(authState.currentUser);
  return () => listeners.delete(callback);
}

export async function signOut(_auth: LocalAuth) {
  authState.currentUser = null;
  persistUser(null);
  emit();
}
