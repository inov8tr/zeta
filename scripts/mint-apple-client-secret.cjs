// scripts/mint-apple-client-secret.cjs
const fs = require("fs");
const jwt = require("jsonwebtoken");

const TEAM_ID = process.env.APPLE_TEAM_ID;
const KEY_ID = process.env.APPLE_KEY_ID;
const CLIENT_ID = process.env.APPLE_SERVICE_ID; // your Service ID, e.g. com.zetaeng.web
const P8_PATH = process.env.APPLE_P8_PATH || "./AuthKey_YOUR_KEY_ID.p8";

const privateKey = fs.readFileSync(P8_PATH);

const now = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: now,
    exp: now + 60 * 60 * 24 * 180, // 6 months max
    aud: "https://appleid.apple.com",
    sub: CLIENT_ID,
  },
  privateKey,
  {
    algorithm: "ES256",
    header: { kid: KEY_ID },
  }
);

console.log(token);
