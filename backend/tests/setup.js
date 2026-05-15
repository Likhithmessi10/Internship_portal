/**
 * Jest global setup — points to the isolated test database so production
 * data is never touched.  Runs once before all test suites.
 */
process.env.DATABASE_URL =
    'postgresql://postgres:2912@localhost:5433/aptransco_test?schema=public';
process.env.JWT_SECRET        = 'test_jwt_secret_aptransco_2026';
process.env.JWT_EXPIRY        = '1h';
process.env.JWT_REFRESH_EXPIRY = '1d';
process.env.NODE_ENV          = 'test';
process.env.PASSWORD_MIN_LENGTH        = '4';
process.env.PASSWORD_REQUIRE_UPPERCASE = 'false';
process.env.PASSWORD_REQUIRE_NUMBER    = 'false';
process.env.PASSWORD_REQUIRE_SPECIAL   = 'false';
