@echo off
title PantauBola Runner
echo Menjalankan script otomatisasi PantauBola...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_project.ps1"
pause
