import { Resend } from "resend";

let resendClient: Resend | null = null;

export const resend = (() => {
  if (resendClient) {
    return resendClient;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }
  resendClient = new Resend(apiKey);
  return resendClient;
})();
