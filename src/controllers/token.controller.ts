import { Context } from "hono";
import { env } from "../config/env";
import { saveTokens } from "../utils/encryption";
import { ApiResponse, TokenLoadRequest } from "../types";

/**
 * Load and encrypt Twitter tokens
 * @param c - Hono context
 * @returns Response with token save result
 */
export const loadTokens = async (c: Context): Promise<Response> => {
  try {
    const { accessToken, refreshToken } = await c.req.json<TokenLoadRequest>();

    if (!accessToken || !refreshToken) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: "Access token and refresh token are required",
          error: "Missing required fields: accessToken and/or refreshToken",
        },
        400
      );
    }

    await saveTokens(accessToken, refreshToken, env.ENCRYPTION_KEY);

    return c.json<ApiResponse>({
      success: true,
      message: "Tokens saved successfully",
    });
  } catch (error) {
    console.error("Error saving tokens:", error);

    return c.json<ApiResponse>(
      {
        success: false,
        message: "Failed to save tokens",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
