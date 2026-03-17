try {
    console.log('Testing adminRoutes...');
    require('../routes/adminRoutes');
    console.log('adminRoutes loaded successfully.');
} catch (err) {
    console.error('Error loading adminRoutes:');
    console.error(err.message);
    if (err.stack) console.error(err.stack);
}

try {
    console.log('\nTesting adminController...');
    require('../controllers/adminController');
    console.log('adminController loaded successfully.');
} catch (err) {
    console.error('Error loading adminController:');
    console.error(err.message);
    if (err.stack) console.error(err.stack);
}
