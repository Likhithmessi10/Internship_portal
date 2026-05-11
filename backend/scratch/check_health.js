const axios = require('axios');

async function checkHealth() {
    try {
        const response = await axios.get('http://127.0.0.1:5001/api/v1/public/health/docling');
        console.log('Health Check Response:', response.data);
    } catch (error) {
        console.error('Health Check Failed:', error.message);
    }
}

checkHealth();
