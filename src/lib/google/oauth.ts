const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
];

const requiredEnv = (key: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "GOOGLE_OAUTH_REDIRECT_URI") => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

export const getGoogleOAuthConfig = () => ({
  clientId: requiredEnv("GOOGLE_CLIENT_ID"),
  clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
  redirectUri: requiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
});

export const buildClassroomConnectUrl = (state: string) => {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CLASSROOM_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
};

type OAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type: string;
  refresh_token?: string;
};

const handleTokenResponse = async (response: Response): Promise<OAuthTokenResponse> => {
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof json.error_description === "string" ? json.error_description : "OAuth token exchange failed.";
    throw new Error(message);
  }
  return json as OAuthTokenResponse;
};

export const exchangeCodeForTokens = async (code: string): Promise<OAuthTokenResponse> => {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return handleTokenResponse(response);
};

export const refreshAccessToken = async (refreshToken: string): Promise<OAuthTokenResponse> => {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return handleTokenResponse(response);
};
