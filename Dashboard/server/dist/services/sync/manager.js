"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAccount = syncAccount;
exports.syncAllAccounts = syncAllAccounts;
exports.startSyncScheduler = startSyncScheduler;
exports.stopSyncScheduler = stopSyncScheduler;
exports.triggerManualSync = triggerManualSync;
const cron_1 = require("cron");
const syncAccount_1 = require("../../models/syncAccount");
const google_1 = require("./google");
const microsoft_1 = require("./microsoft");
const caldav_1 = require("./caldav");
/**
 * Sync a single account
 */
async function syncAccount(syncAccountId, provider) {
    console.log(`Starting sync for account ${syncAccountId} (${provider})`);
    try {
        switch (provider) {
            case 'google':
                await (0, google_1.syncGoogleCalendar)(syncAccountId);
                break;
            case 'microsoft':
                await (0, microsoft_1.syncMicrosoftCalendar)(syncAccountId);
                break;
            case 'caldav':
                await (0, caldav_1.syncCalDAVCalendar)(syncAccountId);
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
        console.log(`Successfully synced account ${syncAccountId} (${provider})`);
    }
    catch (error) {
        console.error(`Failed to sync account ${syncAccountId} (${provider}):`, error);
        throw error;
    }
}
/**
 * Sync all active accounts
 */
async function syncAllAccounts() {
    console.log('Starting sync for all accounts...');
    try {
        const accounts = await (0, syncAccount_1.getAllSyncAccounts)();
        const activeAccounts = accounts.filter(account => account.status === 'active');
        console.log(`Found ${activeAccounts.length} active accounts to sync`);
        // Sync accounts in parallel
        const syncPromises = activeAccounts.map(account => syncAccount(account.id, account.provider).catch(error => {
            console.error(`Sync failed for ${account.id}:`, error);
            // Don't throw - continue syncing other accounts
        }));
        await Promise.all(syncPromises);
        console.log('Finished syncing all accounts');
    }
    catch (error) {
        console.error('Error in syncAllAccounts:', error);
        throw error;
    }
}
/**
 * Setup cron job for periodic syncing
 * Runs every 15 minutes
 */
let syncCronJob = null;
function startSyncScheduler() {
    if (syncCronJob) {
        console.log('Sync scheduler already running');
        return;
    }
    console.log('Starting sync scheduler (every 15 minutes)');
    syncCronJob = new cron_1.CronJob('*/15 * * * *', // Every 15 minutes
    async () => {
        console.log('Cron job triggered - syncing all accounts');
        await syncAllAccounts();
    }, null, true, // Start immediately
    'UTC');
    // Run initial sync
    syncAllAccounts().catch(error => {
        console.error('Initial sync failed:', error);
    });
}
function stopSyncScheduler() {
    if (syncCronJob) {
        console.log('Stopping sync scheduler');
        syncCronJob.stop();
        syncCronJob = null;
    }
}
/**
 * Manually trigger sync for all accounts
 */
async function triggerManualSync() {
    console.log('Manual sync triggered');
    const accounts = await (0, syncAccount_1.getAllSyncAccounts)();
    const activeAccounts = accounts.filter(account => account.status === 'active');
    let success = 0;
    let failed = 0;
    for (const account of activeAccounts) {
        try {
            await syncAccount(account.id, account.provider);
            success++;
        }
        catch (error) {
            console.error(`Failed to sync ${account.id}:`, error);
            failed++;
        }
    }
    return { success, failed };
}
//# sourceMappingURL=manager.js.map