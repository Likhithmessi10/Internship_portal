const { getCommitteeApplications } = require('../controllers/prtiController');
const httpMocks = require('node-mocks-http');

async function test() {
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/v1/prti/committees/applications',
        query: { status: 'SHORTLISTED' },
        user: {
            id: '657ec321-5d4e-407b-9089-2099fe60b790',
            role: 'CE_PRTI'
        }
    });
    const res = httpMocks.createResponse();

    try {
        await getCommitteeApplications(req, res);
        const data = res._getJSONData();
        console.log('Response Success:', data.success);
        console.log('Applications found:', data.data.length);
        if (data.data.length > 0) {
            console.log('First app status:', data.data[0].status);
        } else {
            console.log('Debug info:', JSON.stringify(data._debug, null, 2));
        }
    } catch (err) {
        console.error('Test Error:', err);
    }
    process.exit();
}
test();
