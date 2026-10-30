import serverless from "serverless-http";
import { createApiApp } from "../../server/_core/apiApp";

const expressHandler = serverless(createApiApp());

interface NetlifyFunctionEvent {
  path?: string;
  rawPath?: string;
  rawUrl?: string;
  [key: string]: unknown;
}

interface NetlifyFunctionContext {
  [key: string]: unknown;
}

export async function handler(
  event: NetlifyFunctionEvent,
  context: NetlifyFunctionContext
) {
  const rawPath =
    event.path ??
    event.rawPath ??
    new URL(event.rawUrl ?? "https://netlify.invalid/").pathname;
  const functionPrefix = "/.netlify/functions/api";
  const strippedPath = rawPath.startsWith(functionPrefix)
    ? rawPath.slice(functionPrefix.length) || "/"
    : rawPath;
  const requestPath =
    strippedPath === "/api" ||
    strippedPath.startsWith("/api/") ||
    strippedPath === "/manus-storage" ||
    strippedPath.startsWith("/manus-storage/")
      ? strippedPath
      : `/api${strippedPath === "/" ? "" : strippedPath}`;
  const rawUrl = new URL(event.rawUrl ?? "https://netlify.invalid/");
  rawUrl.pathname = requestPath;

  return expressHandler(
    {
      ...event,
      path: requestPath,
      rawPath: requestPath,
      rawUrl: rawUrl.toString(),
    } as Parameters<typeof expressHandler>[0],
    context as Parameters<typeof expressHandler>[1]
  );
}
