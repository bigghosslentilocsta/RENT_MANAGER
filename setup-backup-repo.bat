@echo off
echo ========================================
echo Rent Management Backup - Initial Setup
echo ========================================
echo.
echo This script will:
echo 1. Create backup folder at D:\Rent-Backups
echo 2. Initialize git repository
echo 3. Connect to your private GitHub repo
echo 4. Create initial commit
echo.
pause

echo.
echo Creating backup directory...
mkdir "D:\Rent-Backups" 2>nul
cd /d "D:\Rent-Backups"

echo Initializing git repository...
git init

echo Adding remote repository...
git remote add origin https://github.com/bigghosslentilocsta/Rent-backup.git

echo Creating .gitignore file...
echo node_modules/ > .gitignore
echo .env >> .gitignore
echo *.log >> .gitignore

echo Creating README.md...
echo # Rent Management System - Database Backups > README.md
echo. >> README.md
echo This repository stores automated backups of the Rent Management MongoDB database. >> README.md
echo. >> README.md
echo ## Backup Structure >> README.md
echo - `/dump` - MongoDB dumps created by mongodump >> README.md
echo. >> README.md
echo ## Auto-Backup >> README.md
echo Backups are created automatically when clicking the "Backup" button in the Rent Management app. >> README.md

echo Staging files...
git add .

echo Creating initial commit...
git commit -m "Initial commit - Backup repository setup"

echo Renaming branch to main...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Backup folder created at: D:\Rent-Backups
echo Connected to: https://github.com/bigghosslentilocsta/Rent-backup.git
echo.
echo You can now use the Backup button in your Rent Management app!
echo.
pause
