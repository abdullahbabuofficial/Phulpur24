@echo off
REM ===========================================================
REM  Phulpur24 — clean audit files and push to GitHub main
REM  Double-click this file. It will:
REM    1. delete the generated audit/test markdown files
REM    2. stage every change in the working tree
REM    3. commit with a clear message
REM    4. push to origin/main
REM ===========================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo  Phulpur24 — cleanup and push
echo  ----------------------------
echo  Project:  %CD%
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo  ERROR: git is not installed or not on PATH.
  echo  Install Git for Windows from https://git-scm.com/download/win
  pause
  exit /b 1
)

echo  Removing generated audit / report markdown...
if exist "AUDIT.md"                   del /q "AUDIT.md"
if exist "TEST_REPORT.md"              del /q "TEST_REPORT.md"
if exist "src\lib\supabase\README.md"  del /q "src\lib\supabase\README.md"

echo.
echo  Current branch:
git rev-parse --abbrev-ref HEAD
echo.

echo  Working tree status:
git status --short
echo.

git add -A
if errorlevel 1 (
  echo  git add failed.
  pause
  exit /b 1
)

set "MSG=feat: end-to-end Supabase wiring + admin overhaul + RLS + storage + sitemap + comments/newsletter/contact + AI route"

echo.
echo  Commit message:
echo    %MSG%
echo.

git commit -m "%MSG%"
if errorlevel 1 (
  echo  Nothing to commit, or commit failed. Continuing to push anyway in case there are unpushed commits.
)

echo.
echo  Pushing to origin/main...
git push origin main
if errorlevel 1 (
  echo.
  echo  Push failed. Common causes:
  echo    - main branch is protected and needs a PR
  echo    - your local main is behind origin (run: git pull --rebase origin main)
  echo    - credentials missing (run: git config --global credential.helper manager)
  pause
  exit /b 1
)

echo.
echo  Done. Latest commit pushed to origin/main.
echo.
pause
