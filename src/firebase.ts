import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { probeFirestoreRest } from './lib/firestoreRest';

const app = initializeApp(firebaseConfig);

function createFirestoreDb(): Firestore {
  try {
    if (typeof window !== 'undefined') {
      return initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
          experimentalLongPollingOptions: { timeoutSeconds: 10 },
        },
        firebaseConfig.firestoreDatabaseId,
      );
    }
  } catch {
    // Fallback if Firestore instance was already initialized during reload
  }
  return getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = createFirestoreDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type ConnectionStatus = 'connected' | 'rest_only' | 'offline';

export async function checkFirestoreConnection(): Promise<ConnectionStatus> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return 'connected';
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      const restState = await probeFirestoreRest();
      if (restState === 'ok') {
        console.warn(
          'Koneksi real-time Firestore (WebChannel) tertunda; direktori publik berjalan melalui mode baca REST.',
        );
        return 'rest_only';
      }
      console.error('Please check your Firebase configuration.');
      return 'offline';
    }
    return 'connected';
  }
}

export async function testConnection(): Promise<boolean> {
  const status = await checkFirestoreConnection();
  return status !== 'offline';
}
