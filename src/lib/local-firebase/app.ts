export interface LocalApp {
  config: unknown;
}

export function initializeApp(config: unknown): LocalApp {
  return { config };
}
