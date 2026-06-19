import type { NextRequest } from "next/server";

export interface Context {
  ipAddress: string;
}

function getIp(req: NextRequest): string {
  // x-real-ip is set by middleware from req.ip (Vercel-trusted, client cannot spoof)
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export function createContext(req: NextRequest): Context {
  return {
    ipAddress: getIp(req),
  };
}
