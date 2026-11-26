import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProjectAsset } from '../types';

const WORKSPACE_ID = 'default';
const INLINE_THRESHOLD = 400_000;
const CHUNK_SIZE = 400_000;
const MAX_CHUNKS = 40;
const MAX_MARKDOWN_LEN = 800_000;
const MAX_CSS_LEN = 200_000;

export function toSafeFirestoreId(rawId: string): string {
  const cleaned = String(rawId || 'asset')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  return cleaned || `asset_${Date.now()}`;
}

function splitIntoChunks(str: string): string[] {
  if (!str) return [];
  const chunks: string[] = [];
  for (let i = 0; i < str.length && chunks.length < MAX_CHUNKS; i += CHUNK_SIZE) {
    chunks.push(str.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

export interface CloudWorkspaceLoadResult {
  workspaceExists: boolean;
  rawMarkdown: string | null;
  customCss: string | null;
  assets: ProjectAsset[];
}

/**
 * Loads the user's workspace (Markdown + CSS) and all saved image assets (reassembling any chunks)
 */
export async function loadCloudProject(userId: string): Promise<CloudWorkspaceLoadResult> {
  const workspacePath = `users/${userId}/workspaces/${WORKSPACE_ID}`;
  const assetsCollectionPath = `users/${userId}/assets`;

  let workspaceExists = false;
  let rawMarkdown: string | null = null;
  let customCss: string | null = null;

  try {
    const wsSnap = await getDoc(doc(db, 'users', userId, 'workspaces', WORKSPACE_ID));
    if (wsSnap.exists()) {
      workspaceExists = true;
      const data = wsSnap.data();
      rawMarkdown = typeof data.rawMarkdown === 'string' ? data.rawMarkdown : '';
      customCss = typeof data.customCss === 'string' ? data.customCss : '';
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, workspacePath);
  }

  const loadedAssets: ProjectAsset[] = [];
  try {
    const q = query(
      collection(db, 'users', userId, 'assets'),
      where('userId', '==', userId)
    );
    const assetsSnap = await getDocs(q);

    for (const assetDoc of assetsSnap.docs) {
      const d = assetDoc.data();
      const assetId = String(d.assetId || assetDoc.id);
      let dataUrl = typeof d.inlineDataUrl === 'string' ? d.inlineDataUrl : '';
      let originalDataUrl = typeof d.originalInlineDataUrl === 'string' ? d.originalInlineDataUrl : '';

      const chunkCount = Number(d.chunkCount || 0);
      const originalChunkCount = Number(d.originalChunkCount || 0);

      if (chunkCount > 0 || originalChunkCount > 0) {
        const chunksPath = `users/${userId}/assets/${assetId}/chunks`;
        try {
          const cq = query(
            collection(db, 'users', userId, 'assets', assetId, 'chunks'),
            where('userId', '==', userId)
          );
          const chunksSnap = await getDocs(cq);
          const currentChunks: { idx: number; data: string }[] = [];
          const origChunks: { idx: number; data: string }[] = [];

          chunksSnap.forEach((cDoc) => {
            const cd = cDoc.data();
            const item = { idx: Number(cd.chunkIndex || 0), data: String(cd.data || '') };
            if (cd.kind === 'original') {
              origChunks.push(item);
            } else {
              currentChunks.push(item);
            }
          });

          if (chunkCount > 0 && currentChunks.length > 0) {
            currentChunks.sort((a, b) => a.idx - b.idx);
            dataUrl = currentChunks.map((c) => c.data).join('');
          }
          if (originalChunkCount > 0 && origChunks.length > 0) {
            origChunks.sort((a, b) => a.idx - b.idx);
            originalDataUrl = origChunks.map((c) => c.data).join('');
          }
        } catch (chunkErr) {
          handleFirestoreError(chunkErr, OperationType.LIST, chunksPath);
        }
      }

      if (!dataUrl) continue;

      loadedAssets.push({
        id: assetId,
        name: String(d.name || 'image.png'),
        path: String(d.path || `images/${d.name || 'image.png'}`),
        dataUrl,
        size: Number(d.size || 0),
        type: String(d.type || 'image/png'),
        addedAt: Number(d.addedAt || Date.now()),
        width: Number(d.width || 0) || undefined,
        height: Number(d.height || 0) || undefined,
        originalDataUrl: originalDataUrl || dataUrl,
        originalWidth: Number(d.originalWidth || 0) || undefined,
        originalHeight: Number(d.originalHeight || 0) || undefined,
        originalSize: Number(d.originalSize || 0) || undefined,
      });
    }

    loadedAssets.sort((a, b) => a.addedAt - b.addedAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, assetsCollectionPath);
  }

  return {
    workspaceExists,
    rawMarkdown,
    customCss,
    assets: loadedAssets,
  };
}

/**
 * Saves or updates the user's workspace (Markdown + CSS) in Firestore
 */
export async function saveCloudWorkspace(
  userId: string,
  rawMarkdown: string,
  customCss: string
): Promise<void> {
  const path = `users/${userId}/workspaces/${WORKSPACE_ID}`;
  const safeMd = String(rawMarkdown || '').slice(0, MAX_MARKDOWN_LEN);
  const safeCss = String(customCss || '').slice(0, MAX_CSS_LEN);
  const wsRef = doc(db, 'users', userId, 'workspaces', WORKSPACE_ID);

  try {
    const existing = await getDoc(wsRef);
    if (existing.exists()) {
      await updateDoc(wsRef, {
        rawMarkdown: safeMd,
        customCss: safeCss,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(wsRef, {
        userId,
        rawMarkdown: safeMd,
        customCss: safeCss,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Saves or updates an image asset (and its chunks if > 400KB) in Firestore
 */
export async function saveCloudAsset(userId: string, asset: ProjectAsset): Promise<void> {
  const safeAssetId = toSafeFirestoreId(asset.id);
  const assetPath = `users/${userId}/assets/${safeAssetId}`;
  const assetRef = doc(db, 'users', userId, 'assets', safeAssetId);

  const currentData = String(asset.dataUrl || '');
  const hasDistinctOriginal =
    Boolean(asset.originalDataUrl) && asset.originalDataUrl !== currentData;
  const originalData = hasDistinctOriginal ? String(asset.originalDataUrl) : '';

  const currentNeedChunks = currentData.length > INLINE_THRESHOLD;
  const currentChunks = currentNeedChunks ? splitIntoChunks(currentData) : [];
  const inlineDataUrl = currentNeedChunks ? '' : currentData;

  const origNeedChunks = originalData.length > INLINE_THRESHOLD;
  const origChunks = origNeedChunks ? splitIntoChunks(originalData) : [];
  const originalInlineDataUrl = origNeedChunks ? '' : originalData;

  const baseFields = {
    name: String(asset.name || 'image.png').slice(0, 256),
    path: String(asset.path || `images/${asset.name || 'image.png'}`).slice(0, 300),
    type: String(asset.type || 'image/png').slice(0, 100),
    size: Math.max(0, Number(asset.size || 0)),
    width: Math.max(0, Number(asset.width || 0)),
    height: Math.max(0, Number(asset.height || 0)),
    inlineDataUrl,
    chunkCount: currentChunks.length,
    originalInlineDataUrl,
    originalChunkCount: origChunks.length,
    originalWidth: Math.max(0, Number(asset.originalWidth || asset.width || 0)),
    originalHeight: Math.max(0, Number(asset.originalHeight || asset.height || 0)),
    originalSize: Math.max(0, Number(asset.originalSize || asset.size || 0)),
  };

  try {
    const existing = await getDoc(assetRef);
    if (existing.exists()) {
      await updateDoc(assetRef, {
        ...baseFields,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(assetRef, {
        userId,
        assetId: safeAssetId,
        addedAt: Math.max(0, Number(asset.addedAt || Date.now())),
        ...baseFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Write chunks if needed (note: chunk rules forbid update, so write fresh unique chunk IDs on rescale/replace and delete old ones)
    if (existing.exists()) {
      const oldChunksQ = query(
        collection(db, 'users', userId, 'assets', safeAssetId, 'chunks'),
        where('userId', '==', userId)
      );
      const oldChunksSnap = await getDocs(oldChunksQ);
      for (const oldDoc of oldChunksSnap.docs) {
        await deleteDoc(oldDoc.ref);
      }
    }

    const writeChunk = async (kind: 'current' | 'original', chunkIndex: number, data: string) => {
      const chunkId = `${kind}_${chunkIndex}_${Date.now()}`;
      const chunkRef = doc(db, 'users', userId, 'assets', safeAssetId, 'chunks', chunkId);
      await setDoc(chunkRef, {
        userId,
        assetId: safeAssetId,
        kind,
        chunkIndex,
        data,
        createdAt: serverTimestamp(),
      });
    };

    for (let i = 0; i < currentChunks.length; i++) {
      await writeChunk('current', i, currentChunks[i]);
    }
    for (let i = 0; i < origChunks.length; i++) {
      await writeChunk('original', i, origChunks[i]);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, assetPath);
  }
}

/**
 * Deletes an image asset and all its chunks from Firestore (chunks deleted BEFORE parent to satisfy Master Gate)
 */
export async function deleteCloudAsset(userId: string, assetId: string): Promise<void> {
  const safeAssetId = toSafeFirestoreId(assetId);
  const assetPath = `users/${userId}/assets/${safeAssetId}`;
  const assetRef = doc(db, 'users', userId, 'assets', safeAssetId);

  try {
    const existing = await getDoc(assetRef);
    if (!existing.exists()) return;

    const chunksQ = query(
      collection(db, 'users', userId, 'assets', safeAssetId, 'chunks'),
      where('userId', '==', userId)
    );
    const chunksSnap = await getDocs(chunksQ);
    for (const cDoc of chunksSnap.docs) {
      await deleteDoc(cDoc.ref);
    }

    await deleteDoc(assetRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, assetPath);
  }
}

/**
 * Removes any cloud assets not present in activeAssets (e.g. after undo or template reset)
 */
export async function pruneCloudAssets(userId: string, activeAssets: ProjectAsset[]): Promise<void> {
  const assetsCollectionPath = `users/${userId}/assets`;
  const keepIds = new Set(activeAssets.map((a) => toSafeFirestoreId(a.id)));
  try {
    const q = query(
      collection(db, 'users', userId, 'assets'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    for (const assetDoc of snap.docs) {
      const id = String(assetDoc.data().assetId || assetDoc.id);
      if (!keepIds.has(id)) {
        await deleteCloudAsset(userId, id);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, assetsCollectionPath);
  }
}

/**
 * Saves an entire batch of assets (used when first signing in, reset, or on manual Save)
 */
export async function syncAllAssetsToCloud(
  userId: string,
  assets: ProjectAsset[],
  pruneRemoved = false
): Promise<void> {
  if (pruneRemoved) {
    await pruneCloudAssets(userId, assets);
  }
  for (const asset of assets) {
    await saveCloudAsset(userId, asset);
  }
}
