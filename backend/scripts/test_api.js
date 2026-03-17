const axios = require('axios');

async function testApi() {
    try {
        const id = '5712daf9-8f9f-4905-a612-84a26e72d55c';
        const url = `http://localhost:5000/api/v1/internships/${id}`; // Assuming backend is on 5000
        console.log(`Testing URL: ${url}`);
        const res = await axios.get(url);
        console.log('--- API Response Data ---');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) {
            console.log('Response Status:', err.response.status);
            console.log('Response Data:', err.response.data);
        }
    }
}

testApi();
