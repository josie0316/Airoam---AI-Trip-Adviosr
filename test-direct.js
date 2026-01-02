// Direct API testing script (not recommended for production)
import axios from 'axios';

// Note: API key should be moved to environment variables in production
const API_KEY = 'AIzaSyCx5Ddmau2zkG9eGKNtyremtkAvPBKVi2I';
const BASE_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

async function testApi() {
  try {
    const params = {
      location: '48.8566,2.3522',
      radius: '1000',
      type: 'restaurant',
      key: API_KEY
    };

    console.log('Testing API with key:', API_KEY);
    const response = await axios.get(BASE_URL, { params });
    console.log('API Response status:', response.data.status);
    console.log('API Response results count:', response.data.results.length);
    console.log('First result (if any):', response.data.results[0]?.name);
  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
  }
}

testApi(); 