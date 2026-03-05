# One-Click Backup Feature Setup

This guide helps you set up the automated mongodump + git backup feature for your Rent Management System.

## Quick Setup (3 Steps)

### Step 1: Run the Setup Script

Simply double-click `setup-backup-repo.bat` in the project root. This will:
- Create `D:\Rent-Backups` folder
- Initialize git repository
- Connect to https://github.com/bigghosslentilocsta/Rent-backup.git
- Create initial commit and push

**OR** do it manually:

```bash
mkdir D:\Rent-Backups
cd D:\Rent-Backups
git init
git remote add origin https://github.com/bigghosslentilocsta/Rent-backup.git
echo # Rent Management Backups > README.md
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 2: Verify MongoDB Tools

Ensure `mongodump` is accessible:

```bash
mongodump --version
```

If not found, add MongoDB to your system PATH:
- Add `C:\Program Files\MongoDB\Server\[VERSION]\bin` to Windows PATH

### Step 3: Restart Backend & Test

```bash
cd backend
npm start
```

Then click the **"💾 Backup"** button in the app header!

## Overview

The backup feature executes the following steps sequentially:
1. **mongodump** - Exports your entire MongoDB database
2. **git add .** - Stages all changes
3. **git commit** - Creates a timestamped commit
4. **git push** - Pushes to your remote repository

## Configuration

All settings are in `backend/src/utils/backupUtils.js`:

```javascript
const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "rent_management";
const BACKUP_REPO_PATH = "D:/Rent-Backups";
```

## Usage

Once set up, simply click the blue **"💾 Backup"** button in the app header.

### What Happens:
1. Button becomes disabled and shows "Backing up..."
2. Database is exported to `D:/Rent-Backups/dump`
3. Files are committed to git with timestamp
4. Changes are pushed to remote repository
5. Success message shows with completion details

### Success Response Example:
```
✓ Backup Successful!

Timestamp: 2026-03-01T10:30:45.123Z

Steps Completed:
• mongodump: Database backup created successfully
• git push: Backup pushed to git repository
```

## Troubleshooting

### Mongodump Command Not Found
- **Issue**: "mongodump is not recognized"
- **Solution**: Add MongoDB bin folder to system PATH
- **Windows Example**: Add `C:\Program Files\MongoDB\Server\6.0\bin`

### Git Push Fails
- **Issue**: "fatal: could not read Password/Passphrase"
- **Solutions**:
  - SSH: Ensure SSH key is added to ssh-agent
  - HTTPS: Use personal access token instead of password
  - Credential Manager: Check Windows Credential Manager stores correct git credentials

### Database Not Found
- **Issue**: "Failed to backup database"
- **Solution**: Verify MongoDB is running and database name is correct
  ```bash
  mongosh
  show databases
  ```

### Directory Not Found
- **Issue**: "Cannot find path"
- **Solution**: Ensure `D:/Rent-Backups` exists and is initialized as git repo
  ```bash
  mkdir D:/Rent-Backups
  cd D:/Rent-Backups
  git init
  ```

### Backup Takes Too Long
- **Note**: First backup exports full database, subsequent ones export changes
- **Time**: Depends on database size and internet speed
- **Optimization**: Keep backup repo local or on fast connection

## Git SSH Setup (Recommended)

For automatic pushes without password prompts:

### Generate SSH Key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### Add to GitHub:
1. Copy public key from `~/.ssh/id_ed25519.pub`
2. Go to GitHub → Settings → SSH Keys
3. Click "New SSH key" and paste

### Test SSH:
```bash
ssh -T git@github.com
```

## File Structure

After first backup:
```
D:/Rent-Backups/
├── .git/                    # Git repository
├── dump/
│   └── rent_management/
│       ├── collections.bson
│       ├── collections.json
│       └── ...
└── .gitignore              # (Optional) ignore node_modules, etc
```

## Scheduling Backups (Optional)

To automate backups on a schedule:

### Windows Task Scheduler:
```bash
# Create a curl command to hit the backup endpoint
curl -X POST http://localhost:5000/api/backup
```

### Linux/Mac Cron:
```bash
# Add to crontab -e
0 2 * * * curl -X POST http://localhost:5000/api/backup
```

This would backup daily at 2 AM.

## Important Notes

⚠️ **Security Considerations**:
- Backup folder contains sensitive data (database credentials in connection strings)
- Keep backup repository private
- Don't commit `mongodump` output if it contains passwords
- Use SSH for git push instead of HTTPS with stored credentials

## Support

If you encounter issues:
1. Check backend console for error messages
2. Review server logs: `npm start` output
3. Test mongodump manually: `mongodump --uri="mongodb://localhost:27017" --db=rent_management --out="D:/Rent-Backups/dump"`
4. Test git: `cd D:/Rent-Backups && git status`
