import { SharedContribution, AuditLog, SyncStatus, ConflictData } from '../types';

type SyncListener = (status: SyncStatus, lastSynced?: string) => void;
type ConflictListener = (conflict: ConflictData | null) => void;

class CloudSyncManager {
  private status: SyncStatus = 'offline';
  private lastSyncedTime: string = localStorage.getItem('lananh_last_synced') || new Date().toISOString();
  private syncListeners: Set<SyncListener> = new Set();
  private conflictListeners: Set<ConflictListener> = new Set();

  public subscribeStatus(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    listener(this.status, this.lastSyncedTime);
    return () => this.syncListeners.delete(listener);
  }

  public subscribeConflict(listener: ConflictListener): () => void {
    this.conflictListeners.add(listener);
    listener(null);
    return () => this.conflictListeners.delete(listener);
  }

  private setStatus(status: SyncStatus) {
    this.status = status;
    this.syncListeners.forEach((fn) => fn(this.status, this.lastSyncedTime));
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getLastSyncedTime(): string {
    return this.lastSyncedTime;
  }

  // Local IndexedDB remains the source of truth until a server authentication provider is configured.
  public queueAutosave(userId: string, userName: string, changes: {
    stories?: unknown[];
    chapters?: unknown[];
    translationMemory?: unknown[];
    vocabulary?: unknown[];
    terminology?: unknown[];
  }) {
    void userId;
    void userName;
    void changes;
    this.setStatus('offline');
  }

  public async pushPendingChanges(userId: string, userName: string): Promise<boolean> {
    void userId;
    void userName;
    this.setStatus('offline');
    return false;
  }

  public async pullCloudData(userId: string, isAdmin = false) {
    void userId;
    void isAdmin;
    this.setStatus('offline');
    return null;
  }

  public async searchSharedKnowledge(query: string, category?: string, source?: string) {
    void query;
    void category;
    void source;
    return { translationMemory: [], vocabulary: [], terminology: [] };
  }

  public async fetchContributions(): Promise<SharedContribution[]> {
    return [];
  }

  public async submitContribution(
    contribution: Omit<SharedContribution, 'id' | 'createdAt' | 'status'>,
    userId: string,
    userName: string
  ): Promise<SharedContribution | null> {
    void contribution;
    void userId;
    void userName;
    return null;
  }

  public async reviewContribution(
    id: string,
    decision: 'APPROVED' | 'REJECTED' | 'MERGE',
    reviewerId: string,
    reviewerName: string,
    notes?: string
  ): Promise<SharedContribution | null> {
    void id;
    void decision;
    void reviewerId;
    void reviewerName;
    void notes;
    return null;
  }

  public async logAudit(userId: string, userName: string, action: string, entityType: string, entityId: string, details: any) {
    void userId;
    void userName;
    void action;
    void entityType;
    void entityId;
    void details;
  }

  public async fetchAuditLogs(): Promise<AuditLog[]> {
    return [];
  }

  public async fetchDashboardStats() {
    return null;
  }
}

export const cloudSync = new CloudSyncManager();