import { Resend } from "resend";

let resendClient: Resend | null = null;
let warnedMissingKey = false;

const createFallbackClient = () => {
  const missingKeyError = new Error("RESEND_API_KEY is not configured.");
  return {
    emails: {
      async send() {
        throw missingKeyError;
      },
    },
  } as unknown as Resend;
};

export const getResendClient = () => {
  if (resendClient) {
    return resendClient;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    if (!warnedMissingKey) {
      console.warn("RESEND_API_KEY is not set; Resend emails will fail until it is configured.");
      warnedMissingKey = true;
    }
    resendClient = createFallbackClient();
    return resendClient;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
};
