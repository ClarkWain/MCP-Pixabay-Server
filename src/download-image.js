import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_KEY = '49336577-79206c89b99e94b8ec58541b9';

async function searchAndDownload() {
  try {
    console.log('Searching for flower images...');
    const searchResponse = await axios.get('https://pixabay.com/api/', {
      params: {
        key: API_KEY,
        q: encodeURIComponent('flower'),
        per_page: 3,
        image_type: 'photo'
      }
    });

    console.log('Search response:', JSON.stringify(searchResponse.data, null, 2));

    if (!searchResponse.data.hits || searchResponse.data.hits.length === 0) {
      console.error('No images found');
      return;
    }

    const imageUrl = searchResponse.data.hits[0].largeImageURL;
    console.log('Downloading image from:', imageUrl);

    const imageResponse = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    const imagesDir = path.join(process.cwd(), '..', 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const imagePath = path.join(imagesDir, 'flower.jpg');
    fs.writeFileSync(imagePath, imageResponse.data);
    console.log(`Image successfully downloaded to: ${imagePath}`);
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response data',
      config: error.config ? {
        url: error.config.url,
        params: error.config.params
      } : 'No config data'
    });
  }
}

searchAndDownload();