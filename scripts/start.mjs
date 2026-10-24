import { spawn } from "node:child_process";
import process from "node:process";

const child = spawn(process.execPath, ["dist/index.js"], {
  env: { ...process.env, NODE_ENV: "production" },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
