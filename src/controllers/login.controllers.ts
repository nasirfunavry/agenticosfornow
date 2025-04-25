import { Context } from "hono";
import axios from "axios";
import crypto from "crypto";
import querystring from "querystring";
import { Buffer } from "buffer";
import { getCookie, setCookie } from "hono/cookie";

interface TwitterTokens {
  access_token: string;
  refresh_token: string;
}


// Configuration – replace with your Twitter app credentials
const config = {
  clientId: process.env.TWITTER_CLIENT_ID,       // Twitter OAuth2 Client ID
  clientSecret: process.env.TWITTER_CLIENT_SECRET, // Twitter OAuth2 Client Secret
  redirectUri: "http://localhost:8000/api/login/callback", // Must match callback in Twitter app settings
  port: 8000,
};

// Generate PKCE code verifier and challenge
const generatePKCE = (): { codeVerifier: string; codeChallenge: string } => {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
};

// Login route – initiates the OAuth flow
export const login = async (c: Context) => {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString("hex");

  // Store the code verifier in a cookie
  setCookie(c, "codeVerifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 5 * 60 * 1000 // 5 minutes
  });

  // Redirect to Twitter's OAuth 2.0 authorization endpoint
  const authorizationUrl = `https://twitter.com/i/oauth2/authorize?${querystring.stringify({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "tweet.read users.read tweet.write offline.access",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })}`;
  
  return c.redirect(authorizationUrl);
};

// Callback route – handles Twitter's redirect back to our app
export const callback = async (c: Context) => {
    const code = c.req.query("code");
  const codeVerifier = getCookie(c, "codeVerifier");
  if (!code || !codeVerifier) {
    return c.json({ error: "Authorization failed: Missing code or verifier" }, 400);
  }
  // Prepare Basic auth header for Twitter token request
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  try {
    // Exchange the authorization code for access and refresh tokens
    const response = await axios.post<TwitterTokens>(
      "https://api.twitter.com/2/oauth2/token",
      querystring.stringify({
        code: code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basicAuth}`,
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    console.log("Access and refresh tokens received:", { access_token, refresh_token });
    return c.json({ access_token, refresh_token });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return c.json({ error: `Error during the token exchange: ${JSON.stringify(error.response?.data || error.message)}` }, 500);
    } else {
      return c.json({ error: "An unexpected error occurred" }, 500);
    }
  }
};

// // Start the server to listen for OAuth requests
// app.listen(config.port, () => {
//   console.log(`Token generator listening on port ${config.port}`);
// });