@echo off
start "" http://localhost:8123
powershell -ExecutionPolicy Bypass -File "%~dp0serveur-local.ps1"
