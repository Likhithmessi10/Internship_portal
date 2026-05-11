const axios = require('axios');

async function checkDocling() {
    try {
        const response = await axios.get('http://127.0.0.1:8000/');
        console.log('Docling Service Status:', response.data);
    } catch (error) {
        console.error('Docling Service Unreachable:', error.message);
    }
}

checkDocling();
