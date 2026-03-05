const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const Flat = require("../models/Flat");
const Tenant = require("../models/Tenant");
const Payment = require("../models/Payment");
const DepositPayment = require("../models/DepositPayment");

const execAsync = promisify(exec);

// ==================== CONFIGURATION ====================
// Update these settings for your environment

const MONGO_URL = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rent_management";

// IMPORTANT: Create this folder and initialize it as a git repo before first backup:
// 1. mkdir D:/Rent-Backups
// 2. cd D:/Rent-Backups
// 3. git init
// 4. git remote add origin https://github.com/bigghosslentilocsta/Rent-backup.git
// 5. git add . && git commit -m "Initial commit" && git push -u origin main

const BACKUP_REPO_PATH = process.env.BACKUP_REPO_PATH || "D:/Rent-Backups";
const BACKUP_DUMP_PATH = `${BACKUP_REPO_PATH}/dump`;

// =======================================================

/**
 * Ensure backup folders exist
 */
const ensureBackupFolders = async () => {
  await fs.promises.mkdir(BACKUP_DUMP_PATH, { recursive: true });
};

/**
 * JSON fallback backup when mongodump is unavailable
 */
const runJsonBackup = async () => {
  await ensureBackupFolders();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(BACKUP_DUMP_PATH, `atlas-backup-${timestamp}.json`);

  const [flats, tenants, payments, depositPayments] = await Promise.all([
    Flat.find({}).lean(),
    Tenant.find({}).lean(),
    Payment.find({}).lean(),
    DepositPayment.find({}).lean()
  ]);

  const payload = {
    createdAt: new Date().toISOString(),
    source: "mongoose-fallback",
    counts: {
      flats: flats.length,
      tenants: tenants.length,
      payments: payments.length,
      depositPayments: depositPayments.length
    },
    data: {
      flats,
      tenants,
      payments,
      depositPayments
    }
  };

  await fs.promises.writeFile(backupFile, JSON.stringify(payload, null, 2), "utf8");

  return {
    success: true,
    message: `JSON backup created successfully (${path.basename(backupFile)})`
  };
};

/**
 * Execute mongodump to backup the database
 */
const runMongoDump = async () => {
  await ensureBackupFolders();
  console.log("Starting mongodump...");
  const command = `mongodump --uri="${MONGO_URL}" --out="${BACKUP_DUMP_PATH}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command, { shell: true });
    console.log("Mongodump output:", stdout);
    if (stderr) console.log("Mongodump stderr:", stderr);
    return { success: true, message: "Database backup created successfully" };
  } catch (err) {
    const errorText = `${err.message || ""} ${err.stderr || ""}`;
    if (/not recognized|ENOENT/i.test(errorText)) {
      console.warn("mongodump not found. Falling back to JSON backup...");
      return runJsonBackup();
    }
    console.error("Mongodump error:", err);
    throw new Error(`Mongodump failed: ${err.message}`);
  }
};

/**
 * Execute git commands to push backup to repo
 */
const pushToGitRepo = async () => {
  console.log("Starting git operations...");
  
  try {
    if (!fs.existsSync(BACKUP_REPO_PATH)) {
      throw new Error(`Backup repository path not found: ${BACKUP_REPO_PATH}`);
    }

    await execAsync("git add .", { shell: true, windowsHide: true, cwd: BACKUP_REPO_PATH });

    try {
      await execAsync(`git commit -m "Auto-backup [${new Date().toISOString()}]"`, {
        shell: true,
        windowsHide: true,
        cwd: BACKUP_REPO_PATH
      });
    } catch (commitError) {
      const commitErrorText = `${commitError.message || ""} ${commitError.stderr || ""}`;
      if (!/nothing to commit/i.test(commitErrorText)) {
        throw commitError;
      }
    }

    const { stdout, stderr } = await execAsync("git push origin main", {
      shell: true,
      windowsHide: true,
      cwd: BACKUP_REPO_PATH
    });

    if (stdout) console.log("Git output:", stdout);
    if (stderr) console.log("Git stderr:", stderr);
    return { success: true, message: "Backup pushed to git repository" };
  } catch (err) {
    console.error("Git error:", err);
    throw new Error(`Git operations failed: ${err.message}`);
  }
};

/**
 * Complete backup process: mongodump + git push
 */
const executeFullBackup = async () => {
  try {
    console.log("=== Starting Full Backup Process ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Database URI: ${MONGO_URL.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@")}`);
    console.log(`Backup Path: ${BACKUP_REPO_PATH}`);

    // Step 1: Run mongodump
    const dumpResult = await runMongoDump();
    console.log("✓ Step 1 Complete:", dumpResult.message);

    // Step 2: Push to git
    const gitResult = await pushToGitRepo();
    console.log("✓ Step 2 Complete:", gitResult.message);

    console.log("=== Full Backup Process Completed Successfully ===");
    return {
      success: true,
      timestamp: new Date().toISOString(),
      steps: [
        { step: "mongodump", status: "completed", message: dumpResult.message },
        { step: "git push", status: "completed", message: gitResult.message }
      ],
      message: "Database backup completed and pushed to repository"
    };
  } catch (err) {
    console.error("Backup process failed:", err);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: err.message,
      message: `Backup failed: ${err.message}`
    };
  }
};

module.exports = { executeFullBackup, runMongoDump, pushToGitRepo };
