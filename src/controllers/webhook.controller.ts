import { Context } from "hono";
import axios from "axios";
import { env } from "../config/env";
import { uploadTwitterPostTweet } from "../services/twitter.service";
import {
  ApiResponse,
  TweetWebhookRequest,
  WebhookRegistrationRequest,
} from "../types";

// ChainGPT API URL
const CHAINGPT_API_URL = "https://webapi.chaingpt.org";

/**
 * Register a webhook with ChainGPT
 * @param c - Hono context
 * @returns Response with registration result
 */
export const registerWebhook = async (c: Context): Promise<Response> => {
  try {
    const { url } = await c.req.json<WebhookRegistrationRequest>();

    if (!url) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: "URL is required",
          error: "Missing required field: url",
        },
        400
      );
    }

    const response = await axios.post(
      `${CHAINGPT_API_URL}/webhook-subscription/register`,
      { url },
      {
        headers: {
          "api-key": env.CHAINGPT_API_KEY,
        },
      }
    );

    return c.json<ApiResponse>({
      success: true,
      message: "Webhook registered successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Error registering webhook:", error);

    return c.json<ApiResponse>(
      {
        success: false,
        message: "Failed to register webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

/**
 * Handle incoming webhook requests for posting tweets
 * @param c - Hono context
 * @returns Response with tweet result
 */
export const tweetWebhook = async (c: Context): Promise<Response> => {
  try {
    const { tweet } = await c.req.json<TweetWebhookRequest>();

    if (!tweet) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: "Tweet content is required",
          error: "Missing required field: tweet",
        },
        400
      );
    }

    let tweetText = tweet;
    //  let tweetText = tweet.slice(0, 270);

    const response = await uploadTwitterPostTweet(tweetText);

    return c.json<ApiResponse>({
      success: true,
      message: "Tweet posted successfully",
      data: { tweetText, response },
    });
  } catch (error) {
    console.error("Error posting tweet via webhook:", error);

    return c.json<ApiResponse>(
      {
        success: false,
        message: "Failed to post tweet",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
