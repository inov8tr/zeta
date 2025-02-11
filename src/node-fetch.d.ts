declare module "node-fetch" {
  import { RequestInit as OriginalRequestInit } from "node-fetch";

  export function fetch(url: string, options?: RequestInit): Promise<Response>;

  export interface RequestInit extends OriginalRequestInit {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;  // Replaced 'any' with 'unknown'
  }

  export interface Response {
    json(): Promise<unknown>;  // Replaced 'any' with 'unknown'
    text(): Promise<string>;
    status: number;
  }
}
