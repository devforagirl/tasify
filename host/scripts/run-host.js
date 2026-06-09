#!/usr/bin/env node
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { platform } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptName = platform() === "win32" ? "run-host.bat" : "run-host.sh";
const launcher = join(__dirname, scriptName);
const child = spawn(launcher, [], { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
