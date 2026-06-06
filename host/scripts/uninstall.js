import { execSync } from "child_process";

const HOST_NAME = "com.tasify.claude.host";
const REG_PATH = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;

try {
  execSync(`reg delete "${REG_PATH}" /f`, { stdio: "pipe" });
  console.log(`\n  [tasify] Registry key removed: ${REG_PATH}\n`);
} catch {
  // Key might not exist, that's fine
}
