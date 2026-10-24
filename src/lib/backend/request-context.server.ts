import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  request: Request;
  headers: Headers;
  status: number;
};

const storage = new AsyncLocalStorage<RequestContext>();

function context(): RequestContext {
  const current = storage.getStore();
  if (!current) throw new Error("Backend request context is unavailable.");
  return current;
}

export function runWithRequestContext<T>(
  request: Request,
  callback: (state: RequestContext) => T,
): T {
  const state: RequestContext = { request, headers: new Headers(), status: 200 };
  return storage.run(state, () => callback(state));
}

export function getRequest(): Request {
  return context().request;
}

export function getRequestHeader(name: string): string | undefined {
  return getRequest().headers.get(name) ?? undefined;
}

export function setResponseStatus(status: number): void {
  context().status = status;
}

export function setResponseHeader(name: string, value: string): void {
  context().headers.set(name, value);
}
