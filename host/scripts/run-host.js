#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bat = join(__dirname, 'run-host.bat');
const child = spawn(bat, [], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
