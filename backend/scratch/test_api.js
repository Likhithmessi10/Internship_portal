const axios = require('axios');

async function test() {
    try {
        // Need to login first to get token
        const loginRes = await axios.post('http://localhost:5001/api/v1/auth/login', {
            email: 'likhithprti@gmail.com',
            password: 'password123' // Assuming this is the password
        });
        const token = loginRes.data.token;

        const res = await axios.get('http://localhost:5001/api/v1/prti/committees/applications?status=SHORTLISTED', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('API Response count:', res.data.data.length);
        console.log('First app:', JSON.stringify(res.data.data[0], null, 2));
    } catch (err) {
        console.error('API Error:', err.response?.data || err.message);
    }
}
test();
