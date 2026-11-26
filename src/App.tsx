/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Header } from './components/Header';
import { MarkdownEditor } from './components/MarkdownEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { FrontmatterEditor } from './components/FrontmatterEditor';
import { MediaManager } from './components/MediaManager';
import { InstructionsTab } from './components/InstructionsTab';
import { HtmlSourceView } from './components/HtmlSourceView';
import { CssEditor } from './components/CssEditor';
import { ViewMode, ProjectAsset, Frontmatter, ActiveTab } from './types';
import { INITIAL_MARKDOWN, DEFAULT_ASSETS } from './utils/template';
import { parseDocument, replaceFrontmatterInDoc, stringifyFrontmatter } from './utils/frontmatter';
import { exportProjectZip, downloadMarkdownFile, downloadHtmlFile } from './utils/exportZip';
import { USER_EMBEDDED_CSS } from './utils/defaultStyle';
import { cleanRunawayBackslashes, extractAndCleanBase64Images } from './utils/htmlToMarkdown';
import { rescaleImage } from './utils/imageRescaler';
import { auth, googleProvider } from './firebase';
import {
  loadLocalProjectFromIdb,
  saveLocalProjectToIdb,
  clearLocalProjectIdb,
} from './utils/localDb';
import {
  loadCloudProject,
  saveCloudWorkspace,
  saveCloudAsset,
  deleteCloudAsset,
  syncAllAssetsToCloud,
  toSafeFirestoreId,
} from './utils/firebasePersistence';

const LOCAL_STORAGE_KEY = 'simple_desdoc_project_backup';

/**
 * Preserve the exact uploaded image file name (only stripping directory paths and characters
 * that break Markdown links, and adding a suffix only if a file with that name already exists).
 */
function preserveUploadedImageName(originalName: string, existingNames: Set<string>): string {
  const leafName = (originalName || 'image.png').split(/[\\/]/).pop() || 'image.png';
  const lastDot = leafName.lastIndexOf('.');
  const rawExt = lastDot !== -1 ? leafName.slice(lastDot) : '.png';
  const rawBase = lastDot !== -1 ? leafName.slice(0, lastDot) : leafName;

  // Keep the uploaded name intact; only replace characters that break Markdown URLs or filesystems
  const cleanBase = rawBase.replace(/\s+/g, '_').replace(/[<>:"/\\|?*\x00-\x1f()\[\]]/g, '') || 'image';
  const cleanExt = rawExt.replace(/\s+/g, '').replace(/[<>:"/\\|?*\x00-\x1f()\[\]]/g, '') || '.png';

  let candidate = `${cleanBase}${cleanExt}`;
  let counter = 1;
  while (existingNames.has(candidate)) {
    candidate = `${cleanBase}_${counter}${cleanExt}`;
    counter++;
  }
  return candidate;
}

interface HistorySnapshot {
  rawMarkdown: string;
  assets: ProjectAsset[];
  customCss: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('writer');
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Load initial state from local storage if available, fallback to defaults
  const [rawMarkdown, setRawMarkdown] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.rawMarkdown === 'string' && parsed.rawMarkdown.trim()) {
          // If the cached template is the old legacy version, upgrade to upstream design document dialect
          if (parsed.rawMarkdown.includes('title: "Assignment 1"') && parsed.rawMarkdown.includes('project: Design Document')) {
            return cleanRunawayBackslashes(INITIAL_MARKDOWN);
          }
          const cleaned = cleanRunawayBackslashes(parsed.rawMarkdown);
          return extractAndCleanBase64Images(cleaned, []).cleanedMd;
        }
      }
    } catch (e) {}
    return cleanRunawayBackslashes(INITIAL_MARKDOWN);
  });

  const [assets, setAssets] = useState<ProjectAsset[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.assets) && parsed.assets.length > 0) {
          const hasManga = parsed.assets.some((a: any) => a.name && a.name.includes('markdown-love-manga'));
          if (!hasManga) {
            return DEFAULT_ASSETS;
          }
          return parsed.assets;
        }
      }
    } catch (e) {}
    return DEFAULT_ASSETS;
  });

  const [customCss, setCustomCss] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.customCss === 'string') {
          return parsed.customCss;
        }
      }
    } catch (e) {}
    return USER_EMBEDDED_CSS;
  });

  // Always keep latest refs so async callbacks never act on stale closures
  const rawMarkdownRef = useRef(rawMarkdown);
  rawMarkdownRef.current = rawMarkdown;
  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const customCssRef = useRef(customCss);
  customCssRef.current = customCss;

  // Firebase Auth & Cloud Sync state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = currentUser;
  const [authLoading, setAuthLoading] = useState(true);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const cloudHydratedRef = useRef(false);
  const cloudLoadedForUidRef = useRef<string | null>(null);
  const hasUserEditedRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [frontmatterOpen, setFrontmatterOpen] = useState(false);
  // User requested image tab (media manager) open by default
  const [mediaManagerOpen, setMediaManagerOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string, duration = 3000) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, duration);
  }, []);

  // Unified Undo / Redo Document History Engine (single state avoids nested setState bugs in React 19)
  const [historyState, setHistoryState] = useState<{
    entries: HistorySnapshot[];
    index: number;
  }>(() => ({
    entries: [{ rawMarkdown, assets, customCss }],
    index: 0,
  }));
  const isHistoryAction = useRef(false);

  // Push a state snapshot into the history stack
  const pushHistorySnapshot = useCallback((newMd: string, newAssets: ProjectAsset[], newCss: string) => {
    if (isHistoryAction.current) return;
    hasUserEditedRef.current = true;
    setHistoryState(prev => {
      const cur = prev.entries[prev.index];
      if (cur && cur.rawMarkdown === newMd && cur.assets === newAssets && cur.customCss === newCss) {
        return prev;
      }
      const sliced = prev.entries.slice(0, prev.index + 1);
      const nextEntries = [...sliced, { rawMarkdown: newMd, assets: newAssets, customCss: newCss }].slice(-50);
      return {
        entries: nextEntries,
        index: nextEntries.length - 1,
      };
    });
  }, []);

  // Debounced auto-snapshot when user edits markdown or CSS
  useEffect(() => {
    if (isHistoryAction.current) return;
    const timer = setTimeout(() => {
      pushHistorySnapshot(rawMarkdown, assets, customCss);
    }, 800);
    return () => clearTimeout(timer);
  }, [rawMarkdown, assets, customCss, pushHistorySnapshot]);

  // Undo: Revert to previous document snapshot
  const handleUndo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.index <= 0) return prev;
      const targetIdx = prev.index - 1;
      const snapshot = prev.entries[targetIdx];
      if (!snapshot) return prev;

      const assetsChanged = snapshot.assets !== assetsRef.current;
      isHistoryAction.current = true;
      queueMicrotask(() => {
        setRawMarkdown(snapshot.rawMarkdown);
        setAssets(snapshot.assets);
        setCustomCss(snapshot.customCss);
        showToast('Undo (Ctrl+Z)', 1200);
        setTimeout(() => {
          isHistoryAction.current = false;
        }, 100);

        if (assetsChanged && currentUserRef.current && cloudHydratedRef.current) {
          const uid = currentUserRef.current.uid;
          setIsSyncingCloud(true);
          syncAllAssetsToCloud(uid, snapshot.assets, true)
            .catch((err) => console.error('Cloud undo sync error:', err))
            .finally(() => setIsSyncingCloud(false));
        }
      });

      return { ...prev, index: targetIdx };
    });
  }, [showToast]);

  // Redo: Advance to next document snapshot
  const handleRedo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.index >= prev.entries.length - 1) return prev;
      const targetIdx = prev.index + 1;
      const snapshot = prev.entries[targetIdx];
      if (!snapshot) return prev;

      const assetsChanged = snapshot.assets !== assetsRef.current;
      isHistoryAction.current = true;
      queueMicrotask(() => {
        setRawMarkdown(snapshot.rawMarkdown);
        setAssets(snapshot.assets);
        setCustomCss(snapshot.customCss);
        showToast('Redo (Ctrl+Y)', 1200);
        setTimeout(() => {
          isHistoryAction.current = false;
        }, 100);

        if (assetsChanged && currentUserRef.current && cloudHydratedRef.current) {
          const uid = currentUserRef.current.uid;
          setIsSyncingCloud(true);
          syncAllAssetsToCloud(uid, snapshot.assets, true)
            .catch((err) => console.error('Cloud redo sync error:', err))
            .finally(() => setIsSyncingCloud(false));
        }
      });

      return { ...prev, index: targetIdx };
    });
  }, [showToast]);

  // Parse frontmatter and body reactively
  const { frontmatter, body } = useMemo(() => {
    return parseDocument(rawMarkdown);
  }, [rawMarkdown]);

  // Update frontmatter from inspector or directly from preview header
  const handleFrontmatterChange = useCallback((updatedFm: Frontmatter) => {
    const updatedMd = replaceFrontmatterInDoc(rawMarkdownRef.current, updatedFm);
    setRawMarkdown(updatedMd);
    pushHistorySnapshot(updatedMd, assetsRef.current, customCssRef.current);
  }, [pushHistorySnapshot]);

  // Update markdown body from direct in-place preview editing
  const handleMarkdownBodyChange = useCallback((newBody: string) => {
    const { frontmatter: currentFm } = parseDocument(rawMarkdownRef.current);
    const fmString = stringifyFrontmatter(currentFm);
    const cleaned = cleanRunawayBackslashes(newBody.trim());
    // Also catch any base64 image strings that may have slipped in
    const { cleanedMd, newAssets } = extractAndCleanBase64Images(cleaned, assetsRef.current);
    let updatedAssets = assetsRef.current;
    if (newAssets.length > 0) {
      const normalizedNewAssets = newAssets.map((a) => ({
        ...a,
        id: toSafeFirestoreId(a.id),
      }));
      updatedAssets = [...assetsRef.current, ...normalizedNewAssets];
      setAssets(updatedAssets);

      if (currentUserRef.current && cloudHydratedRef.current) {
        const uid = currentUserRef.current.uid;
        setIsSyncingCloud(true);
        Promise.all(normalizedNewAssets.map((a) => saveCloudAsset(uid, a)))
          .catch((err) => console.error('Cloud base64 asset sync error:', err))
          .finally(() => setIsSyncingCloud(false));
      }
    }
    const fullDoc = `${fmString}\n\n${cleanedMd}`;
    setRawMarkdown(fullDoc);
    pushHistorySnapshot(fullDoc, updatedAssets, customCssRef.current);
  }, [pushHistorySnapshot]);

  // Update image asset directly after rescaling (keeps markdown, HTML, and CSS untouched)
  const handleUpdateAsset = useCallback((updatedAsset: ProjectAsset) => {
    const updatedList = assetsRef.current.map(a => a.id === updatedAsset.id ? updatedAsset : a);
    setAssets(updatedList);
    pushHistorySnapshot(rawMarkdownRef.current, updatedList, customCssRef.current);
    const dimText = updatedAsset.width && updatedAsset.height ? ` to ${updatedAsset.width}×${updatedAsset.height}px` : '';
    showToast(`Rescaled ${updatedAsset.name}${dimText}`);

    if (currentUserRef.current && cloudHydratedRef.current) {
      const uid = currentUserRef.current.uid;
      setIsSyncingCloud(true);
      saveCloudAsset(uid, updatedAsset)
        .catch((err) => console.error('Cloud rescale sync error:', err))
        .finally(() => setIsSyncingCloud(false));
    }
  }, [pushHistorySnapshot, showToast]);

  // Drag-and-release rescale callback from document preview
  const handleRescaleImagePixels = useCallback(async (assetId: string, width: number, height: number) => {
    const asset = assetsRef.current.find(a => a.id === assetId);
    if (!asset) return;

    try {
      const sourceDataUrl = asset.originalDataUrl || asset.dataUrl;
      const format = asset.type || 'image/png';
      const result = await rescaleImage(sourceDataUrl, width, height, format, 0.92);

      const updated: ProjectAsset = {
        ...asset,
        dataUrl: result.dataUrl,
        size: result.size,
        width: result.width,
        height: result.height,
        originalDataUrl: asset.originalDataUrl || asset.dataUrl,
        originalWidth: asset.originalWidth || asset.width || width,
        originalHeight: asset.originalHeight || asset.height || height,
        originalSize: asset.originalSize || asset.size,
      };

      const nextAssets = assetsRef.current.map(a => a.id === assetId ? updated : a);
      setAssets(nextAssets);
      pushHistorySnapshot(rawMarkdownRef.current, nextAssets, customCssRef.current);
      showToast(`Rescaled ${asset.name} to ${result.width}×${result.height}px (Undo: Ctrl+Z)`);

      if (currentUserRef.current && cloudHydratedRef.current) {
        const uid = currentUserRef.current.uid;
        setIsSyncingCloud(true);
        saveCloudAsset(uid, updated)
          .catch((err) => console.error('Cloud preview rescale sync error:', err))
          .finally(() => setIsSyncingCloud(false));
      }
    } catch (err) {
      console.error('Failed to rescale image from preview drag:', err);
    }
  }, [pushHistorySnapshot, showToast]);

  // Process uploaded/dropped files into assets keeping the exact uploaded filename
  const handleAddFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(
      f => f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(f.name)
    );
    const totalFiles = imageFiles.length;
    if (totalFiles === 0) return;

    const existingNames = new Set(assetsRef.current.map(a => a.name));
    const newlyAddedAssets: ProjectAsset[] = [];
    const snippetsToInsert: string[] = [];
    let processedCount = 0;

    imageFiles.forEach((file, idx) => {
      const preservedName = preserveUploadedImageName(file.name, existingNames);
      existingNames.add(preservedName);
      const path = `images/${preservedName}`;
      const id = toSafeFirestoreId(`${preservedName}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`);

      const checkDone = () => {
        processedCount++;
        if (processedCount === totalFiles && newlyAddedAssets.length > 0) {
          const nextAssets = [...assetsRef.current, ...newlyAddedAssets];
          const nextMd = rawMarkdownRef.current + snippetsToInsert.join('');
          setAssets(nextAssets);
          setRawMarkdown(nextMd);
          setMediaManagerOpen(true);
          pushHistorySnapshot(nextMd, nextAssets, customCssRef.current);

          if (currentUserRef.current && cloudHydratedRef.current) {
            const uid = currentUserRef.current.uid;
            setIsSyncingCloud(true);
            Promise.all([
              saveCloudWorkspace(uid, nextMd, customCssRef.current),
              ...newlyAddedAssets.map((asset) => saveCloudAsset(uid, asset)),
            ])
              .then(() => {
                showToast(`Saved ${newlyAddedAssets.length} image(s) to cloud & images/`);
              })
              .catch((err) => {
                console.error('Cloud image upload sync error:', err);
                showToast(`Added ${newlyAddedAssets.length} image(s) locally (cloud sync failed)`);
              })
              .finally(() => setIsSyncingCloud(false));
          } else {
            showToast(`Added ${newlyAddedAssets.length} image(s) to images/ directory`);
          }
        }
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const img = new Image();
          img.onload = () => {
            const w = img.naturalWidth || 800;
            const h = img.naturalHeight || 600;
            newlyAddedAssets.push({
              id,
              name: preservedName,
              path,
              dataUrl,
              size: file.size,
              type: file.type || 'image/png',
              addedAt: Date.now(),
              width: w,
              height: h,
              originalDataUrl: dataUrl,
              originalWidth: w,
              originalHeight: h,
              originalSize: file.size,
            });
            snippetsToInsert.push(`\n\n![${preservedName}](${path})\n`);
            checkDone();
          };
          img.onerror = () => {
            newlyAddedAssets.push({
              id,
              name: preservedName,
              path,
              dataUrl,
              size: file.size,
              type: file.type || 'image/png',
              addedAt: Date.now(),
              originalDataUrl: dataUrl,
            });
            snippetsToInsert.push(`\n\n![${preservedName}](${path})\n`);
            checkDone();
          };
          img.src = dataUrl;
        } else {
          checkDone();
        }
      };
      reader.onerror = () => checkDone();

      reader.readAsDataURL(file);
    });
  }, [pushHistorySnapshot, showToast]);

  const saveToLocalStorage = useCallback((md: string, css: string, assetList: ProjectAsset[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        rawMarkdown: md,
        customCss: css,
        assets: assetList,
        savedAt: Date.now()
      }));
    } catch (err) {
      console.warn('LocalStorage save warning (asset quota limit):', err);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          rawMarkdown: md,
          customCss: css,
          assets: [],
          savedAt: Date.now()
        }));
      } catch (e) {}
    }
  }, []);

  // Hydrate full local project (including large uploaded images) from IndexedDB on initial mount
  useEffect(() => {
    let cancelled = false;
    loadLocalProjectFromIdb().then((idbData) => {
      if (cancelled || !idbData) return;
      // Do not overwrite if cloud project already loaded or user already started editing
      if (cloudLoadedForUidRef.current || hasUserEditedRef.current) return;

      const isLegacy =
        typeof idbData.rawMarkdown === 'string' &&
        idbData.rawMarkdown.includes('title: "Assignment 1"') &&
        idbData.rawMarkdown.includes('project: Design Document');

      if (isLegacy) return;

      const restoredMd =
        typeof idbData.rawMarkdown === 'string' && idbData.rawMarkdown.trim()
          ? cleanRunawayBackslashes(idbData.rawMarkdown)
          : rawMarkdownRef.current;
      const restoredCss =
        typeof idbData.customCss === 'string' ? idbData.customCss : customCssRef.current;
      const restoredAssets =
        Array.isArray(idbData.assets) && idbData.assets.length > 0
          ? idbData.assets
          : assetsRef.current;

      isHistoryAction.current = true;
      setRawMarkdown(restoredMd);
      setCustomCss(restoredCss);
      setAssets(restoredAssets);
      setHistoryState({
        entries: [{ rawMarkdown: restoredMd, assets: restoredAssets, customCss: restoredCss }],
        index: 0,
      });
      setTimeout(() => {
        isHistoryAction.current = false;
      }, 100);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to Firebase Authentication & load/migrate Cloud Workspace + Images
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setAuthLoading(false);

      if (!firebaseUser) {
        cloudHydratedRef.current = false;
        cloudLoadedForUidRef.current = null;
        return;
      }

      if (cloudLoadedForUidRef.current === firebaseUser.uid) {
        return;
      }

      cloudHydratedRef.current = false;
      setIsSyncingCloud(true);

      try {
        const cloud = await loadCloudProject(firebaseUser.uid);
        if (auth.currentUser?.uid !== firebaseUser.uid) return;

        if (cloud.workspaceExists) {
          const nextMd =
            cloud.rawMarkdown !== null && cloud.rawMarkdown.trim()
              ? cleanRunawayBackslashes(cloud.rawMarkdown)
              : rawMarkdownRef.current;
          const nextCss =
            cloud.customCss !== null ? cloud.customCss : customCssRef.current;
          const nextAssets = cloud.assets;

          isHistoryAction.current = true;
          setRawMarkdown(nextMd);
          setCustomCss(nextCss);
          setAssets(nextAssets);
          setHistoryState({
            entries: [{ rawMarkdown: nextMd, assets: nextAssets, customCss: nextCss }],
            index: 0,
          });
          setTimeout(() => {
            isHistoryAction.current = false;
          }, 100);

          saveToLocalStorage(nextMd, nextCss, nextAssets);
          await saveLocalProjectToIdb({
            rawMarkdown: nextMd,
            customCss: nextCss,
            assets: nextAssets,
            savedAt: Date.now(),
          });

          cloudLoadedForUidRef.current = firebaseUser.uid;
          cloudHydratedRef.current = true;
          showToast(
            `Signed in — loaded ${nextAssets.length} saved image${nextAssets.length === 1 ? '' : 's'} from cloud`
          );
        } else {
          // Brand-new cloud account: upload current local workspace & all images right away
          const mdToSave = rawMarkdownRef.current;
          const cssToSave = customCssRef.current;
          const assetsToSave = assetsRef.current;

          await saveCloudWorkspace(firebaseUser.uid, mdToSave, cssToSave);
          await syncAllAssetsToCloud(firebaseUser.uid, assetsToSave, false);

          cloudLoadedForUidRef.current = firebaseUser.uid;
          cloudHydratedRef.current = true;
          showToast(
            `Google connected — saved ${assetsToSave.length} image${assetsToSave.length === 1 ? '' : 's'} to cloud`
          );
        }
      } catch (err) {
        console.error('Failed to sync cloud project on sign-in:', err);
        cloudHydratedRef.current = false;
        showToast('Cloud sync failed — keeping local project', 4000);
      } finally {
        setIsSyncingCloud(false);
      }
    });

    return () => unsubscribe();
  }, [saveToLocalStorage, showToast]);

  // Debounced auto-save to IndexedDB, localStorage, and Firestore workspace (if signed in)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalStorage(rawMarkdown, customCss, assets);
      saveLocalProjectToIdb({
        rawMarkdown,
        customCss,
        assets,
        savedAt: Date.now(),
      });

      if (currentUser && cloudHydratedRef.current) {
        saveCloudWorkspace(currentUser.uid, rawMarkdown, customCss).catch((err) => {
          console.error('Auto-save cloud workspace error:', err);
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [rawMarkdown, customCss, assets, currentUser, saveToLocalStorage]);

  const handleRemoveAsset = useCallback((id: string) => {
    const nextAssets = assetsRef.current.filter(a => a.id !== id);
    setAssets(nextAssets);
    pushHistorySnapshot(rawMarkdownRef.current, nextAssets, customCssRef.current);

    if (currentUserRef.current && cloudHydratedRef.current) {
      const uid = currentUserRef.current.uid;
      setIsSyncingCloud(true);
      deleteCloudAsset(uid, id)
        .catch((err) => console.error('Cloud asset delete error:', err))
        .finally(() => setIsSyncingCloud(false));
    }
  }, [pushHistorySnapshot]);

  const handleInsertMarkdown = useCallback((snippet: string) => {
    setRawMarkdown(prev => prev + '\n' + snippet);
  }, []);

  // Saves to IndexedDB, local storage, Firestore cloud (if signed in), AND exports the project ZIP
  const handleSaveProject = useCallback(async () => {
    try {
      setIsExporting(true);
      // 1. Immediately persist state to browser local storage & IndexedDB
      saveToLocalStorage(rawMarkdown, customCss, assets);
      await saveLocalProjectToIdb({
        rawMarkdown,
        customCss,
        assets,
        savedAt: Date.now(),
      });

      // 2. If signed in with Google, flush workspace + all assets to Firestore
      let syncedCloud = false;
      if (currentUserRef.current) {
        const uid = currentUserRef.current.uid;
        setIsSyncingCloud(true);
        try {
          await saveCloudWorkspace(uid, rawMarkdown, customCss);
          await syncAllAssetsToCloud(uid, assets, true);
          syncedCloud = true;
        } finally {
          setIsSyncingCloud(false);
        }
      }

      // 3. Export & download the full ZIP to local disk
      await exportProjectZip(frontmatter, rawMarkdown, assets, customCss);

      // 4. Show feedback toast
      showToast(
        syncedCloud
          ? 'Saved to cloud, local storage & exported ZIP (Ctrl+S)'
          : 'Saved to local storage & exported ZIP (Ctrl+S)'
      );
    } catch (err) {
      console.error('Failed to export project zip:', err);
      showToast('Save failed. Please check console for details.');
    } finally {
      setIsExporting(false);
    }
  }, [frontmatter, rawMarkdown, assets, customCss, saveToLocalStorage, showToast]);

  // Global window listener for Ctrl+S (Save), Ctrl+Z (Undo), Ctrl+Y (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (!isCtrlOrMeta) return;

      // Save: Ctrl+S / Cmd+S
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if (e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          // If the focused element is not an interactive input/textarea, handleUndo directly
          const activeEl = document.activeElement;
          const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
          if (!isInput) {
            e.preventDefault();
            handleUndo();
          }
        }
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y
      if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveProject, handleUndo, handleRedo]);

  const handleDownloadMd = useCallback(() => {
    downloadMarkdownFile(rawMarkdown, frontmatter);
  }, [rawMarkdown, frontmatter]);

  const handleDownloadHtml = useCallback(() => {
    downloadHtmlFile(frontmatter, body, customCss);
  }, [frontmatter, body, customCss]);

  const handleResetTemplate = useCallback(async () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
    await clearLocalProjectIdb();

    const resetMd = cleanRunawayBackslashes(INITIAL_MARKDOWN);
    isHistoryAction.current = true;
    setRawMarkdown(resetMd);
    setAssets(DEFAULT_ASSETS);
    setCustomCss(USER_EMBEDDED_CSS);
    setHistoryState({
      entries: [{ rawMarkdown: resetMd, assets: DEFAULT_ASSETS, customCss: USER_EMBEDDED_CSS }],
      index: 0,
    });
    setTimeout(() => {
      isHistoryAction.current = false;
    }, 100);

    if (currentUserRef.current && cloudHydratedRef.current) {
      const uid = currentUserRef.current.uid;
      setIsSyncingCloud(true);
      try {
        await saveCloudWorkspace(uid, resetMd, USER_EMBEDDED_CSS);
        await syncAllAssetsToCloud(uid, DEFAULT_ASSETS, true);
      } catch (err) {
        console.error('Cloud reset sync error:', err);
      } finally {
        setIsSyncingCloud(false);
      }
    }

    showToast('Template reset to default', 2500);
  }, [showToast]);

  const handleImportMd = useCallback((text: string, filename?: string) => {
    if (!text || !text.trim()) return;
    const cleaned = cleanRunawayBackslashes(text);
    setRawMarkdown(cleaned);
    pushHistorySnapshot(cleaned, assetsRef.current, customCssRef.current);
    saveToLocalStorage(cleaned, customCssRef.current, assetsRef.current);
    saveLocalProjectToIdb({
      rawMarkdown: cleaned,
      customCss: customCssRef.current,
      assets: assetsRef.current,
      savedAt: Date.now(),
    });
    setActiveTab('writer');
    showToast(`Imported ${filename || 'markdown file'}`, 2500);
  }, [pushHistorySnapshot, saveToLocalStorage, showToast]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Google sign-in failed:', err);
      showToast('Google Sign-In failed. Please allow popups and try again.', 3500);
    }
  }, [showToast]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      cloudLoadedForUidRef.current = null;
      cloudHydratedRef.current = false;
      showToast('Signed out — local backup preserved', 2500);
    } catch (err) {
      console.error('Sign-out failed:', err);
      showToast('Sign-out failed', 2500);
    }
  }, [showToast]);

  // Prevent browser from navigating to dropped file anywhere in the window (which causes white screen).
  // Note: Image drops are intentionally ONLY handled by MediaManager & MarkdownEditor, NOT the preview.
  useEffect(() => {
    const handleWinDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWinDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        // Check for Markdown file import (.md or .markdown)
        const mdFile = files.find(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));
        if (mdFile) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
              handleImportMd(text, mdFile.name);
            }
          };
          reader.readAsText(mdFile);
        }
      }
    };

    window.addEventListener('dragover', handleWinDragOver, false);
    window.addEventListener('drop', handleWinDrop, false);
    return () => {
      window.removeEventListener('dragover', handleWinDragOver);
      window.removeEventListener('drop', handleWinDrop);
    };
  }, [handleImportMd]);

  // React element drag-and-drop listener on page (only prevents default navigation & handles .md files)
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const mdFile = files.find(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));
      if (mdFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            handleImportMd(text, mdFile.name);
          }
        };
        reader.readAsText(mdFile);
      }
    }
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden bg-black font-sans"
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
    >
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        frontmatterOpen={frontmatterOpen}
        setFrontmatterOpen={setFrontmatterOpen}
        mediaManagerOpen={mediaManagerOpen}
        setMediaManagerOpen={setMediaManagerOpen}
        assets={assets}
        frontmatter={frontmatter}
        customCss={customCss}
        onExportZip={handleSaveProject}
        onDownloadMd={handleDownloadMd}
        onDownloadHtml={handleDownloadHtml}
        onImportMd={handleImportMd}
        isExporting={isExporting}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyState.index > 0}
        canRedo={historyState.index < historyState.entries.length - 1}
        user={
          currentUser
            ? {
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
              }
            : null
        }
        authLoading={authLoading}
        isSyncingCloud={isSyncingCloud}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'instructions' && (
          <InstructionsTab
            onBackToEditor={() => setActiveTab('writer')}
            onResetTemplate={handleResetTemplate}
          />
        )}

        {activeTab === 'css' && (
          <CssEditor
            css={customCss}
            onChange={setCustomCss}
            onViewDoc={() => {
              setActiveTab('writer');
              setViewMode('preview');
            }}
          />
        )}

        {activeTab === 'writer' && (
          <>
            {/* View Mode Switching */}
            {viewMode === 'split' && (
              <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col">
                  <MarkdownEditor
                    value={rawMarkdown}
                    onChange={setRawMarkdown}
                    onDropFiles={handleAddFiles}
                    assets={assets}
                    onOpenMediaManager={() => setMediaManagerOpen(true)}
                    onSaveShortcut={handleSaveProject}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                  />
                </div>
                <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col">
                  <DocumentPreview
                    frontmatter={frontmatter}
                    onFrontmatterChange={handleFrontmatterChange}
                    markdownBody={body}
                    onMarkdownBodyChange={handleMarkdownBodyChange}
                    assets={assets}
                    customCss={customCss}
                    onSaveShortcut={handleSaveProject}
                    onRescaleImagePixels={handleRescaleImagePixels}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                  />
                </div>
              </div>
            )}

            {viewMode === 'preview' && (
              <DocumentPreview
                frontmatter={frontmatter}
                onFrontmatterChange={handleFrontmatterChange}
                markdownBody={body}
                onMarkdownBodyChange={handleMarkdownBodyChange}
                assets={assets}
                customCss={customCss}
                onSaveShortcut={handleSaveProject}
                onRescaleImagePixels={handleRescaleImagePixels}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />
            )}

            {viewMode === 'html' && (
              <HtmlSourceView
                frontmatter={frontmatter}
                markdownBody={body}
                embeddedCss={customCss}
              />
            )}

            {/* Frontmatter Inspector Drawer */}
            {frontmatterOpen && (
              <FrontmatterEditor
                frontmatter={frontmatter}
                onChange={handleFrontmatterChange}
                onClose={() => setFrontmatterOpen(false)}
              />
            )}

            {/* Media Manager Drawer with Image Rescaling Modal Window */}
            {mediaManagerOpen && (
              <MediaManager
                assets={assets}
                onAddAssets={handleAddFiles}
                onRemoveAsset={handleRemoveAsset}
                onUpdateAsset={handleUpdateAsset}
                onInsertMarkdown={handleInsertMarkdown}
                onClose={() => setMediaManagerOpen(false)}
              />
            )}
          </>
        )}
      </div>

      {/* Save Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-white text-black border border-white px-3.5 py-2 rounded shadow-2xl flex items-center gap-2.5 z-50 text-xs font-mono font-bold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
