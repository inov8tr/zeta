import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type GoogleTokenRow = Database["public"]["Tables"]["google_tokens"]["Row"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedClient = SupabaseClient<Database, any, any>;

type TokenUpsertParams = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
};

const computeExpiry = (expiresIn: number) => new Date(Date.now() + expiresIn * 1000).toISOString();

export async function getGoogleTokenRecord(client: TypedClient, userId: string) {
  const { data, error } = await client
    .from("google_tokens")
    .select("user_id, access_token, refresh_token, scope, token_type, expires_at, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle<GoogleTokenRow>();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function upsertGoogleToken(client: TypedClient, userId: string, payload: TokenUpsertParams) {
  const expiresAt = computeExpiry(payload.expires_in);
  const nowIso = new Date().toISOString();
  const update: Database["public"]["Tables"]["google_tokens"]["Insert"] = {
    user_id: userId,
    access_token: payload.access_token,
    refresh_token: payload.refresh_token ?? undefined,
    scope: payload.scope ?? undefined,
    token_type: payload.token_type,
    expires_at: expiresAt,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { error } = await client.from("google_tokens").upsert(update);
  if (error) {
    throw error;
  }

  return { expires_at: expiresAt };
}

export async function updateGoogleToken(client: TypedClient, userId: string, payload: TokenUpsertParams) {
  const expiresAt = computeExpiry(payload.expires_in);
  const update: Database["public"]["Tables"]["google_tokens"]["Update"] = {
    access_token: payload.access_token,
    token_type: payload.token_type,
    scope: payload.scope ?? undefined,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };

  if (payload.refresh_token) {
    update.refresh_token = payload.refresh_token;
  }

  const { error } = await client.from("google_tokens").update(update).eq("user_id", userId);
  if (error) {
    throw error;
  }

  return { expires_at: expiresAt };
}

export async function deleteGoogleToken(client: TypedClient, userId: string) {
  const { error } = await client.from("google_tokens").delete().eq("user_id", userId);
  if (error) {
    throw error;
  }
}
