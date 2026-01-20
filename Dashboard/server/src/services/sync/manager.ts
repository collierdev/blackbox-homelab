import { CronJob } from 'cron';
import { getAllSyncAccounts } from '../../models/syncAccount';
import { syncGoogleCalendar } from './google';
import { syncMicrosoftCalendar } from './microsoft';
import { syncCalDAVCalendar } from './caldav';

/**
 * Sync a single account
 */
export async function syncAccount(syncAccountId: string, provider: string): Promise<void> {
  console.log(`Starting sync for account ${syncAccountId} (${provider})`);

  try {
    switch (provider) {
      case 'google':
        await syncGoogleCalendar(syncAccountId);
        break;
      case 'microsoft':
        await syncMicrosoftCalendar(syncAccountId);
        break;
      case 'caldav':
        await syncCalDAVCalendar(syncAccountId);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    console.log(`Successfully synced account ${syncAccountId} (${provider})`);
  } catch (error) {
    console.error(`Failed to sync account ${syncAccountId} (${provider}):`, error);
    throw error;
  }
}

/**
 * Sync all active accounts
 */
export async function syncAllAccounts(): Promise<void> {
  console.log('Starting sync for all accounts...');

  try {
    const accounts = await getAllSyncAccounts();

    const activeAccounts = accounts.filter(account => account.status === 'active');

    console.log(`Found ${activeAccounts.length} active accounts to sync`);

    // Sync accounts in parallel
    const syncPromises = activeAccounts.map(account =>
      syncAccount(account.id, account.provider).catch(error => {
        console.error(`Sync failed for ${account.id}:`, error);
        // Don't throw - continue syncing other accounts
      })
    );

    await Promise.all(syncPromises);

    console.log('Finished syncing all accounts');
  } catch (error) {
    console.error('Error in syncAllAccounts:', error);
    throw error;
  }
}

/**
 * Setup cron job for periodic syncing
 * Runs every 15 minutes
 */
let syncCronJob: CronJob | null = null;

export function startSyncScheduler(): void {
  if (syncCronJob) {
    console.log('Sync scheduler already running');
    return;
  }

  console.log('Starting sync scheduler (every 15 minutes)');

  syncCronJob = new CronJob(
    '*/15 * * * *', // Every 15 minutes
    async () => {
      console.log('Cron job triggered - syncing all accounts');
      await syncAllAccounts();
    },
    null,
    true, // Start immediately
    'UTC'
  );

  // Run initial sync
  syncAllAccounts().catch(error => {
    console.error('Initial sync failed:', error);
  });
}

export function stopSyncScheduler(): void {
  if (syncCronJob) {
    console.log('Stopping sync scheduler');
    syncCronJob.stop();
    syncCronJob = null;
  }
}

/**
 * Manually trigger sync for all accounts
 */
export async function triggerManualSync(): Promise<{ success: number; failed: number }> {
  console.log('Manual sync triggered');

  const accounts = await getAllSyncAccounts();
  const activeAccounts = accounts.filter(account => account.status === 'active');

  let success = 0;
  let failed = 0;

  for (const account of activeAccounts) {
    try {
      await syncAccount(account.id, account.provider);
      success++;
    } catch (error) {
      console.error(`Failed to sync ${account.id}:`, error);
      failed++;
    }
  }

  return { success, failed };
}
