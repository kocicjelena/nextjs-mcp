// lib/services/facebookService.ts
/**
 * FacebookService - Wrapper around Meta's Graph API
 * Handles authentication, API calls, and error handling for Facebook operations
 *  "brain" that handles all communication with Meta's Graph API. It validates credentials,  *  * constructs requests properly, and handles errors gracefully. It includes methods for posting  * to pages, retrieving page info, getting recent posts, and deleting posts. You create the  *  * service by passing your credentials, and then it's ready to be used by your MCP tools.
 */

import axios, { AxiosInstance } from "axios";

export interface FacebookPostInput {
  pageId: string;
  message: string;
  imageUrl?: string;
  link?: string;
}

export interface FacebookPageInfo {
  id: string;
  name: string;
  description?: string;
  followers_count?: number;
  fan_count?: number;
  category?: string;
}

export interface FacebookPostResponse {
  id: string;
  message: string;
  created_time: string;
  permalink_url?: string;
}

export class FacebookService {
  private client: AxiosInstance;
  private appId: string;
  private appSecret: string;
  private pageAccessToken: string;

  constructor(appId: string, appSecret: string, pageAccessToken: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.pageAccessToken = pageAccessToken;

    // Create axios instance with base URL for Graph API
    this.client = axios.create({
      baseURL: "https://graph.facebook.com/v18.0",
      timeout: 10000,
    });
  }

  /**
   * Post to a Facebook page
   * @param pageId - Facebook page ID
   * @param message - Post message/content
   * @param imageUrl - Optional image URL
   * @param link - Optional link to include
   */
  async postToPage(
    pageId: string,
    message: string,
    imageUrl?: string,
    link?: string
  ): Promise<FacebookPostResponse> {
    try {
      const data: Record<string, string> = {
        message,
        access_token: this.pageAccessToken,
      };

      if (imageUrl) {
        data.image = imageUrl;
      }

      if (link) {
        data.link = link;
      }

      const response = await this.client.post(`/${pageId}/feed`, data);

      return {
        id: response.data.id,
        message,
        created_time: new Date().toISOString(),
        permalink_url: response.data.post_id
          ? `https://www.facebook.com/${pageId}/posts/${response.data.post_id}`
          : undefined,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to post to Facebook page");
    }
  }

  /**
   * Get information about a Facebook page
   * @param pageId - Facebook page ID
   */
  async getPageInfo(pageId: string): Promise<FacebookPageInfo> {
    try {
      const fields =
        "id,name,description,followers_count,fan_count,category";

      const response = await this.client.get(`/${pageId}`, {
        params: {
          fields,
          access_token: this.pageAccessToken,
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        followers_count: response.data.followers_count,
        fan_count: response.data.fan_count,
        category: response.data.category,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get page information");
    }
  }

  /**
   * Get recent posts from a Facebook page
   * @param pageId - Facebook page ID
   * @param limit - Number of posts to retrieve (default: 10)
   */
  async getPagePosts(
    pageId: string,
    limit: number = 10
  ): Promise<FacebookPostResponse[]> {
    try {
      const response = await this.client.get(`/${pageId}/feed`, {
        params: {
          fields: "id,message,created_time,permalink_url",
          limit,
          access_token: this.pageAccessToken,
        },
      });

      return response.data.data.map(
        (post: {
          id: string;
          message?: string;
          created_time: string;
          permalink_url?: string;
        }) => ({
          id: post.id,
          message: post.message || "[No caption]",
          created_time: post.created_time,
          permalink_url: post.permalink_url,
        })
      );
    } catch (error) {
      throw this.handleError(error, "Failed to retrieve page posts");
    }
  }

  /**
   * Delete a post from a Facebook page
   * @param postId - Post ID to delete
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.client.delete(`/${postId}`, {
        params: {
          access_token: this.pageAccessToken,
        },
      });

      return true;
    } catch (error) {
      throw this.handleError(error, "Failed to delete post");
    }
  }

  /**
   * Centralized error handling
   */
  private handleError(error: unknown, context: string): Error {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.error?.message ||
        error.message ||
        "Unknown error";
      return new Error(`${context}: ${message}`);
    }

    return new Error(`${context}: ${String(error)}`);
  }
}

/**
 * Factory function to create FacebookService from environment variables
 */
export function createFacebookService(): FacebookService {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!appId || !appSecret || !pageAccessToken) {
    throw new Error(
      "Missing Facebook credentials in environment variables. " +
        "Set FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_PAGE_ACCESS_TOKEN"
    );
  }

  return new FacebookService(appId, appSecret, pageAccessToken);
}
