const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testMatch() {
    try {
        const formData = new FormData();
        // Just send a dummy text as "file" for now to check connectivity
        const blob = new Blob(['dummy resume content'], { type: 'text/plain' });
        formData.append('resume', blob, 'resume.txt');
        formData.append('jd_text', JSON.stringify({ title: 'Software Engineer', description: 'React and Node' }));

        const response = await axios.post('http://127.0.0.1:8000/match', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Match Test Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Match Test Failed (Response):', error.response.status, error.response.data);
        } else {
            console.error('Match Test Failed (Error):', error.message);
        }
    }
}

testMatch();
