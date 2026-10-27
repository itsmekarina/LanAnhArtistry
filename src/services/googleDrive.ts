import { getGoogleAccessToken } from './googleAuth';

export interface DriveFoldersMap {
  rootId: string;
  backupsId: string;
  storiesId: string;
  exportsId: string;
  restoreId: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  size?: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3';

// 1. Ensure LanAnhArtistry Folder Structure exists in Google Drive
export async function ensureAppFolders(token?: string): Promise<DriveFoldersMap> {
  const accessToken = token || (await getGoogleAccessToken());
  if (!accessToken) {
    throw new Error('Chưa đăng nhập tài khoản Google Drive.');
  }

  // Check cached folder IDs
  try {
    const cached = localStorage.getItem('lananh_gdrive_folders');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.rootId && parsed.backupsId) {
        // Quick verification: test root folder existence
        const verifyRes = await fetch(`${DRIVE_API_URL}/files/${parsed.rootId}?fields=id,trashed`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (verifyRes.ok) {
          const vData = await verifyRes.json();
          if (!vData.trashed) return parsed;
        }
      }
    }
  } catch (e) {
    // Ignore cache failure and search/create
  }

  // Find or create Root folder: LanAnhArtistry
  const rootId = await findOrCreateFolder('LanAnhArtistry', 'root', accessToken);

  // Find or create subfolders
  const backupsId = await findOrCreateFolder('Backups', rootId, accessToken);
  const storiesId = await findOrCreateFolder('Stories', rootId, accessToken);
  const exportsId = await findOrCreateFolder('Exports', rootId, accessToken);
  const restoreId = await findOrCreateFolder('Restore', rootId, accessToken);

  const folderMap: DriveFoldersMap = {
    rootId,
    backupsId,
    storiesId,
    exportsId,
    restoreId,
  };

  localStorage.setItem('lananh_gdrive_folders', JSON.stringify(folderMap));
  return folderMap;
}

async function findOrCreateFolder(name: string, parentId: string, accessToken: string): Promise<string> {
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false and '${parentId}' in parents`;
  const searchRes = await fetch(
    `${DRIVE_API_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Không thể tạo thư mục '${name}' trên Google Drive: ${errText}`);
  }

  const created = await createRes.json();
  return created.id;
}

// 2. Upload JSON / Text File via Multipart or Resumable Upload
export async function uploadFileToDrive(
  name: string,
  content: string | Blob,
  mimeType: string,
  folderId: string,
  onProgress?: (percent: number) => void
): Promise<DriveFileItem> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error('Chưa đăng nhập Google Drive.');
  }

  const blobContent = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;

  // Use Resumable Upload for files > 2MB or if requested for safe streaming
  if (blobContent.size > 2 * 1024 * 1024) {
    return uploadFileToDriveResumable(name, blobContent, mimeType, folderId, onProgress);
  }

  onProgress?.(20);

  const metadata = {
    name,
    mimeType,
    parents: [folderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Read blob content as binary string or array buffer
  const reader = new FileReader();
  const contentPromise = new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsBinaryString(blobContent);
  });
  const fileData = await contentPromise;

  onProgress?.(50);

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: binary\r\n\r\n' +
    fileData +
    closeDelimiter;

  const res = await fetch(`${UPLOAD_API_URL}/files?uploadType=multipart&fields=id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  onProgress?.(90);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload file lên Google Drive thất bại: ${err}`);
  }

  const uploaded = await res.json();
  onProgress?.(100);
  return uploaded;
}

// Resumable upload implementation for large backup archives
export async function uploadFileToDriveResumable(
  name: string,
  blob: Blob,
  mimeType: string,
  folderId: string,
  onProgress?: (percent: number) => void
): Promise<DriveFileItem> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error('Chưa đăng nhập Google Drive.');
  }

  onProgress?.(10);

  // 1. Initialize resumable session
  const initRes = await fetch(
    `${UPLOAD_API_URL}/files?uploadType=resumable`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': blob.size.toString(),
      },
      body: JSON.stringify({
        name,
        parents: [folderId],
        mimeType,
      }),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`Khởi tạo phiên Resumable Upload thất bại: ${err}`);
  }

  const sessionUri = initRes.headers.get('Location');
  if (!sessionUri) {
    throw new Error('Không nhận được Session URI cho Google Drive resumable upload.');
  }

  onProgress?.(30);

  // 2. Upload file content with chunking & progress tracking
  const chunkSize = 1024 * 1024; // 1MB chunks
  let startByte = 0;
  const totalBytes = blob.size;

  while (startByte < totalBytes) {
    const endByte = Math.min(startByte + chunkSize, totalBytes);
    const chunkBlob = blob.slice(startByte, endByte);

    const chunkRes = await fetch(sessionUri, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${startByte}-${endByte - 1}/${totalBytes}`,
      },
      body: chunkBlob,
    });

    const currentPercent = Math.min(95, Math.round((endByte / totalBytes) * 100));
    onProgress?.(currentPercent);

    if (chunkRes.status === 200 || chunkRes.status === 201) {
      // Finished
      const finalData = await chunkRes.json();
      onProgress?.(100);
      return finalData;
    } else if (chunkRes.status === 308) {
      // Incomplete, check Range header from Drive
      const range = chunkRes.headers.get('Range');
      if (range) {
        const match = range.match(/bytes=0-(\d+)/);
        if (match) {
          startByte = parseInt(match[1], 10) + 1;
        } else {
          startByte = endByte;
        }
      } else {
        startByte = endByte;
      }
    } else {
      const err = await chunkRes.text();
      throw new Error(`Lỗi gián đoạn khi upload chunk (${chunkRes.status}): ${err}`);
    }
  }

  throw new Error('Không thể hoàn thành tải tệp lên Google Drive.');
}

// Ensure specific Story folder inside LanAnhArtistry/Stories/
export async function ensureStoryFolder(storyTitle: string): Promise<string> {
  const folders = await ensureAppFolders();
  const safeName = storyTitle.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Untitled_Story';
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Drive');
  return await findOrCreateFolder(safeName, folders.storiesId, token);
}

// Upload raw export file to LanAnhArtistry/Exports/
export async function uploadRawExportFile(
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<DriveFileItem> {
  const folders = await ensureAppFolders();
  return uploadFileToDrive(fileName, content, mimeType, folders.exportsId);
}

// 3. List Files in a specific Folder
export async function listFolderFiles(
  folderId: string,
  options?: { query?: string; orderBy?: string }
): Promise<DriveFileItem[]> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error('Chưa đăng nhập Google Drive.');
  }

  let q = `'${folderId}' in parents and trashed = false`;
  if (options?.query) {
    q += ` and (${options.query})`;
  }

  const orderBy = options?.orderBy || 'createdTime desc';
  const res = await fetch(
    `${DRIVE_API_URL}/files?q=${encodeURIComponent(q)}&orderBy=${encodeURIComponent(
      orderBy
    )}&fields=files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink)&pageSize=100`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi tải danh sách file từ Google Drive: ${err}`);
  }

  const data = await res.json();
  return data.files || [];
}

// 4. Download file content
export async function downloadFileContent(fileId: string): Promise<string> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error('Chưa đăng nhập Google Drive.');
  }

  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Không thể tải tệp từ Google Drive (Status: ${res.status})`);
  }

  return await res.text();
}

// Download binary blob (e.g. DOCX)
export async function downloadFileBlob(fileId: string): Promise<Blob> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error('Chưa đăng nhập Google Drive.');
  }

  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Không thể tải tệp nhị phân từ Google Drive (Status: ${res.status})`);
  }

  return await res.blob();
}

// 5. Delete file
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    throw new Error('Chưa đăng nhập Google Drive.');
  }

  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return res.ok || res.status === 204;
}

// 6. Get Drive Storage Quota
export async function getDriveStorageQuota(): Promise<{
  limitBytes: number;
  usageBytes: number;
  usageInDriveBytes: number;
  userEmail: string;
} | null> {
  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) return null;

    const res = await fetch(`${DRIVE_API_URL}/about?fields=storageQuota,user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;
    const data = await res.json();

    return {
      limitBytes: parseInt(data.storageQuota?.limit || '0', 10),
      usageBytes: parseInt(data.storageQuota?.usage || '0', 10),
      usageInDriveBytes: parseInt(data.storageQuota?.usageInDrive || '0', 10),
      userEmail: data.user?.emailAddress || '',
    };
  } catch (e) {
    return null;
  }
}
