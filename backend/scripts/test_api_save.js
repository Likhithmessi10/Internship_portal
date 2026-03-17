const axios = require('axios');
const fs = require('fs');

async function testApi() {
    try {
        const id = '5712daf9-8f9f-4905-a612-84a26e72d55c';
        const url = `http://localhost:5001/api/v1/internships/${id}`;
        console.log(`Testing URL: ${url}`);
        const res = await axios.get(url);
        fs.writeFileSync('api_response.json', JSON.stringify(res.data, null, 2));
        console.log('Response saved to api_response.json');
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

testApi();
