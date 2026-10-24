import { spawn } from "node:child_process";
import process from "node:process";

const child = spawn(
  process.execPath,
  ["node_modules/tsx/dist/cli.mjs", "watch", "server/_core/index.ts"],
  {
    env: { ...process.env, NODE_ENV: "development" },
    stdio: "inherit",
  }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
