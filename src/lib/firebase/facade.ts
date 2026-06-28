/**
 * Platform-agnostisk facade over Firebase. UI- og repository-laget afhænger KUN
 * af disse typer — aldrig direkte af @react-native-firebase eller firebase (JS SDK).
 * Web-grenen implementeres i client.web.ts, native i client.native.ts.
 */

export type Unsubscribe = () => void;

export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthFacade {
  /** Nuværende bruger (synkront, fra cache) eller null. */
  getCurrentUser(): AuthUser | null;
  /** Lyt på login-status. Returnerer unsubscribe. */
  onAuthStateChanged(cb: (user: AuthUser | null) => void): Unsubscribe;
  signInWithEmail(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

/** Et dokument med dets id flettet ind i data. */
export type WithId<T> = T & { id: string };

/** Snapshot af en kollektion, inkl. offline-metadata. */
export interface CollectionSnapshot<T> {
  docs: WithId<T>[];
  /** Data kommer fra den lokale cache (offline eller endnu ikke synket). */
  fromCache: boolean;
  /** Der findes lokale skrivninger som endnu ikke er bekræftet af serveren. */
  hasPendingWrites: boolean;
}

export interface QueryOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

/** En enkelt operation i en batch-skrivning. */
export type BatchOp =
  | { type: 'set'; path: string; data: Record<string, unknown>; merge?: boolean }
  | { type: 'update'; path: string; data: Record<string, unknown> }
  | { type: 'delete'; path: string };

export interface DbFacade {
  /** Realtime-abonnement på en kollektion (læser fra cache når offline). */
  subscribeCollection<T>(
    path: string,
    options: QueryOptions,
    onChange: (snapshot: CollectionSnapshot<T>) => void,
    onError?: (error: Error) => void
  ): Unsubscribe;

  /** Realtime-abonnement på ét dokument. */
  subscribeDoc<T>(
    path: string,
    onChange: (doc: WithId<T> | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe;

  /** Engangslæsning af ét dokument. */
  getDoc<T>(path: string): Promise<WithId<T> | null>;

  /** Opretter et dokument med auto-id i en kollektion. Returnerer id'et. */
  addDoc<T extends Record<string, unknown>>(collectionPath: string, data: T): Promise<string>;

  /** Sætter et dokument på en fast sti (merge=true bevarer øvrige felter). */
  setDoc<T extends Record<string, unknown>>(
    docPath: string,
    data: T,
    merge?: boolean
  ): Promise<void>;

  /** Opdaterer felter på et eksisterende dokument. */
  updateDoc(docPath: string, data: Record<string, unknown>): Promise<void>;

  /** Sletter et dokument. */
  deleteDoc(docPath: string): Promise<void>;

  /**
   * Skriver mange operationer i batches (≤500 pr. commit → ét netværkskald i stedet
   * for hundredvis). `onProgress` kaldes efter hver commit med akkumuleret antal.
   * `shouldCancel` tjekkes før hver batch → afbryder rent (allerede committede batches
   * består). `chunkSize` styrer hvor ofte fremdrift rapporteres (default 450).
   */
  commitBatch(
    ops: BatchOp[],
    opts?: {
      chunkSize?: number;
      onProgress?: (done: number, total: number) => void;
      shouldCancel?: () => boolean;
    }
  ): Promise<void>;
}
