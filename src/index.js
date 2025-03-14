#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.PIXABAY_API_KEY;
if (!API_KEY) {
  throw new Error('PIXABAY_API_KEY environment variable is required');
}

class PixabayServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pixabay-server',
        version: '1.0.0',
        author: '韦天鹏'
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: 'https://pixabay.com/api/',
      params: {
        key: API_KEY,
      },
    });

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_images',
          description: 'Search for images on Pixabay',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (URL encoded, max 100 chars)',
              },
              lang: {
                type: 'string',
                description: 'Language code for search',
                enum: ['cs', 'da', 'de', 'en', 'es', 'fr', 'id', 'it', 'hu', 'nl', 'no', 'pl', 'pt', 'ro', 'sk', 'fi', 'sv', 'tr', 'vi', 'th', 'bg', 'ru', 'el', 'ja', 'ko', 'zh'],
                default: 'en'
              },
              id: {
                type: 'string',
                description: 'Retrieve individual images by ID'
              },
              image_type: {
                type: 'string',
                enum: ['all', 'photo', 'illustration', 'vector'],
                description: 'Filter results by image type',
                default: 'all'
              },
              orientation: {
                type: 'string',
                enum: ['all', 'horizontal', 'vertical'],
                description: 'Filter by image orientation',
                default: 'all'
              },
              category: {
                type: 'string',
                enum: ['backgrounds', 'fashion', 'nature', 'science', 'education', 'feelings', 'health', 'people', 'religion', 'places', 'animals', 'industry', 'computer', 'food', 'sports', 'transportation', 'travel', 'buildings', 'business', 'music'],
                description: 'Filter results by category'
              },
              min_width: {
                type: 'number',
                description: 'Minimum image width',
                minimum: 0,
                default: 0
              },
              min_height: {
                type: 'number',
                description: 'Minimum image height',
                minimum: 0,
                default: 0
              },
              colors: {
                type: 'string',
                description: 'Filter images by color (comma separated)',
                enum: ['grayscale', 'transparent', 'red', 'orange', 'yellow', 'green', 'turquoise', 'blue', 'lilac', 'pink', 'white', 'gray', 'black', 'brown']
              },
              editors_choice: {
                type: 'boolean',
                description: 'Select images with Editor\'s Choice award',
                default: false
              },
              safesearch: {
                type: 'boolean',
                description: 'Enable safe search',
                default: false
              },
              order: {
                type: 'string',
                enum: ['popular', 'latest'],
                description: 'How to order the results',
                default: 'popular'
              },
              page: {
                type: 'number',
                description: 'Page number',
                minimum: 1,
                default: 1
              },
              per_page: {
                type: 'number',
                description: 'Results per page (3-200)',
                minimum: 3,
                maximum: 200,
                default: 20
              }
            },
            required: ['query'],
          },
        },
        {
          name: 'download_image',
          description: 'Download an image from Pixabay by URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Image URL to download',
              },
              filepath: {
                type: 'string',
                description: 'Path where to save the image',
              },
            },
            required: ['url', 'filepath'],
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'search_images':
            return await this.handleSearchImages(request.params.arguments);
          case 'download_image':
            return await this.handleDownloadImage(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `Pixabay API error: ${error.response?.data?.message || error.message}`
          );
        }
        throw error;
      }
    });
  }

  async handleSearchImages({
    query,
    lang = 'en',
    id,
    image_type = 'all',
    orientation = 'all',
    category,
    min_width = 0,
    min_height = 0,
    colors,
    editors_choice = false,
    safesearch = false,
    order = 'popular',
    page = 1,
    per_page = 20
  }) {
    const response = await this.axiosInstance.get('', {
      params: {
        q: query,
        lang,
        id,
        image_type,
        orientation,
        category,
        min_width,
        min_height,
        colors,
        editors_choice,
        safesearch,
        order,
        page,
        per_page,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async handleDownloadImage({ url, filepath }) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      // Create directory if it doesn't exist
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filepath, response.data);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully downloaded image to ${filepath}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to download image: ${error.message}, \nurl: ${url}, \nfilepath: ${filepath}`
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Pixabay MCP server running on stdio');
  }
}

const server = new PixabayServer();
server.run().catch(console.error);