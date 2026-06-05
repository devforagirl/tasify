@echo off
REM Tasify Native Messaging Host Launcher
REM Write debug info to temp log
echo [%date% %time%] Launcher started > "%TEMP%\tasify-host-debug.log"
echo [%date% %time%] Args: %* >> "%TEMP%\tasify-host-debug.log"
echo [%date% %time%] Dir: %CD% >> "%TEMP%\tasify-host-debug.log"
echo [%date% %time%] Node: D:\Program Files\nodejs\node.exe >> "%TEMP%\tasify-host-debug.log"

REM Launch node, keeping stdin/stdout pipes alive
"D:\Program Files\nodejs\node.exe" "%~dp0..\src\index.js"

set EXIT_CODE=%ERRORLEVEL%
echo [%date% %time%] Node exited with code: %EXIT_CODE% >> "%TEMP%\tasify-host-debug.log"
exit /b %EXIT_CODE%
