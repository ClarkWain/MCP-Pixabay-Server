# Pixabay MCP Server

MCP server for searching and downloading images from Pixabay.

## Installation

```bash
npm install -g mcp-pixabay-server
```

## Configuration

The server requires a Pixabay API key. You can get one by signing up at [Pixabay](https://pixabay.com/api/docs/), and then go to the [API settings](https://pixabay.com/api/docs/#api_key) to get your key.

Add the following to your MCP settings file (typically located at `~/.config/roo/mcp_settings.json` or similar):

```json
{
  "mcpServers": {
    "pixabay": {
      "command": "pixabay-server",
      "env": {
        "PIXABAY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### search_images

Search for images on Pixabay with various filters and parameters.

Parameters:
- `query` (required): Search query (URL encoded, max 100 chars)
- `lang`: Language code for search (default: 'en')
  - Supported: cs, da, de, en, es, fr, id, it, hu, nl, no, pl, pt, ro, sk, fi, sv, tr, vi, th, bg, ru, el, ja, ko, zh
- `id`: Retrieve individual images by ID
- `image_type`: Filter results by image type (default: 'all')
  - Options: 'all', 'photo', 'illustration', 'vector'
- `orientation`: Filter by image orientation (default: 'all')
  - Options: 'all', 'horizontal', 'vertical'
- `category`: Filter results by category
  - Options: backgrounds, fashion, nature, science, education, feelings, health, people, religion, places, animals, industry, computer, food, sports, transportation, travel, buildings, business, music
- `min_width`: Minimum image width (default: 0)
- `min_height`: Minimum image height (default: 0)
- `colors`: Filter images by color (comma separated)
  - Options: grayscale, transparent, red, orange, yellow, green, turquoise, blue, lilac, pink, white, gray, black, brown
- `editors_choice`: Select images with Editor's Choice award (default: false)
- `safesearch`: Enable safe search (default: false)
- `order`: How to order the results (default: 'popular')
  - Options: 'popular', 'latest'
- `page`: Page number (default: 1)
- `per_page`: Results per page (3-200, default: 20)

Example:
```javascript
const result = await useMcpTool("pixabay", "search_images", {
  query: "nature",
  image_type: "photo",
  orientation: "horizontal",
  category: "nature",
  colors: "green,blue",
  per_page: 10
});
```

### download_image

Download an image from Pixabay by URL.

Parameters:
- `url` (required): Image URL to download
- `filepath` (required): Path where to save the image

Example:
```javascript
const result = await useMcpTool("pixabay", "download_image", {
  url: "https://pixabay.com/get/example-image.jpg",
  filepath: "./images/downloaded-image.jpg"
});
```

## License

MIT