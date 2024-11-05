// AppConfig.js
require('dotenv').config();

const config = {
    environment: process.env.NODE_ENV,
    appPort: process.env.APP_PORT || 3000,
    saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 10,
    postgres: {
        user: process.env.POSTGRES_USER || 'user',
        host: process.env.POSTGRES_HOST,
        password: process.env.POSTGRES_PASSWORD || 'password',
        port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
        databaseName: process.env.NODE_ENV === 'test' ? process.env.POSTGRES_TEST_DB_NAME || 'test_database_name' : process.env.POSTGRES_DB,
    },
    pgAdmin: {
        email: process.env.PGADMIN_DEFAULT_EMAIL,
        password: process.env.PGADMIN_DEFAULT_PASSWORD,
    },
    easySlip: {
        url: process.env.EASYSLIP_URL,
        key: process.env.EASYSLIP_KEY,
    },
    redis: {
        host: process.env.REDIS_HOST || 'redis', // service name in docker-compose
        port: process.env.REDIS_PORT || 6379,
    },
    app_secret: process.env.APP_SECRET,
    app_domain: process.env.APP_DOMAIN,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret'
};

module.exports = config;
