const axios = require('axios');

const LIQUIPEDIA_API_URL = 'https://liquipedia.net/valorant/api.php';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function test() {
  console.log('Testing Liquipedia API...');
  try {
    const response = await axios.get(LIQUIPEDIA_API_URL, {
      params: {
        action: 'parse',
        page: 'Liquipedia:Matches',
        format: 'json'
      },
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Encoding': 'gzip'
      },
      timeout: 10000
    });
    console.log('Success! Response keys:', Object.keys(response.data));
    if (response.data.parse) {
      console.log('Page title:', response.data.parse.title);
      console.log('Content length:', response.data.parse.text['*'].length);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

test();
