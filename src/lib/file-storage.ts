/**
 * Generic persistent browser file storage using native IndexedDB.
 * Supports image uploads (statement images, notebook solution photos) and PDFs
 * across browser refreshes without server binary limits or external API keys.
 */

const DB_NAME = "sistemos_files_db";
const DB_VERSION = 1;
const STORE_NAME = "uploaded_files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB não disponível no ambiente atual."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeLocalFile(
  fileId: string,
  fileOrBlob: File | Blob
): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const record = {
      id: fileId,
      blob: fileOrBlob,
      timestamp: Date.now(),
    };

    const request = store.put(record);
    request.onsuccess = () => resolve(`idb://${fileId}`);
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalFileBlob(fileId: string): Promise<Blob | null> {
  const cleanId = fileId.replace(/^idb:\/\//, "");
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(cleanId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.blob) {
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function getLocalFileUrl(fileIdOrUrl: string): Promise<string> {
  if (!fileIdOrUrl) return "";
  if (fileIdOrUrl.startsWith("http://") || fileIdOrUrl.startsWith("https://") || fileIdOrUrl.startsWith("data:")) {
    return fileIdOrUrl;
  }

  const blob = await getLocalFileBlob(fileIdOrUrl);
  if (!blob) return fileIdOrUrl;
  return URL.createObjectURL(blob);
}

export async function deleteLocalFile(fileId: string): Promise<void> {
  const cleanId = fileId.replace(/^idb:\/\//, "");
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(cleanId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore cleanup error
  }
}

/**
 * Converts a File or Blob to a base64 Data URL.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
