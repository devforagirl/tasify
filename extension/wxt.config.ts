import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Tasify",
    version: "1.0.0",
    permissions: ["nativeMessaging", "storage", "alarms", "notifications"],
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA03qYCGLn91EYZ2we/FTrZO0JbvGlVDXHhao/HECpn8tYQcovF8G39lWkRngwTEB3VYqgNcARY/ssgX7/N6IgM/JYCZSk2jhu2/0pA1/HpNrLModEGPmdzPob5rXG0BAf0vFTFl9PFqohITQaGV6btfSDGYn+4jVVhfl2neDzI9kjnyuwUTcD5f4Wnsy4aadu4iiMC7/buq2jzC47IB1z8ET4x558JFTfjOzCsut1CsA9gJ8mj6DFm0+p62io3v0WhhAA1ETmhH+mHpAa8oKqIJm0mnUD7G348BX20JRPyJfxzP/AlELa1aR9fXSgIXNO4DcWcbAMDvS4QGpz4/kr2QIDAQAB",
    action: {
      default_title: "Tasify",
      default_popup: "popup.html",
      default_icon: {
        16: "/icons/16.png",
        48: "/icons/48.png",
        128: "/icons/128.png",
      },
    },
  },
  env: {
    NATIVE_HOST_ID: "com.tasify.claude.host",
  },
});