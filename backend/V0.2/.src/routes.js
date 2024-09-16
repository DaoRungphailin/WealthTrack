const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
const appConfigs = require('./configs/AppConfigs');

const Utils = require('./utilities/Utils');
const mdw = require('./middlewares/Middlewares')
const userController = require('./controllers/UserController');

const NODE_ENV = appConfigs.environment;
const logger = Utils.Logger('Routes');
const { formatResponse } = Utils;
const router = express.Router();
const UserController = new userController();

if (NODE_ENV != 'test') {
    const file = fs.readFileSync('./swagger.yaml', 'utf8');
    const swaggerDocument = YAML.parse(file)
    router.use('/docs', swaggerUi.serve);
    router.get('/docs', swaggerUi.setup(swaggerDocument));
}
const allowedMethods = {
    '/': ['GET'],
    '/users': ['POST'],
    '/users/:national_id': ['GET', 'PATCH', 'DELETE'],
    '/debts': ['GET', 'POST', 'PATCH', 'DELETE'],
    '/debts/:debtName': ['GET', 'PATCH', 'DELETE']
}

if (NODE_ENV != 'production') {
    allowedMethods['/users/check'] = ['POST'];
}

router.use((req, res, next) => {
    logger.info(`entering the routing for ${req.method} ${req.url}`);
    next();
})
router.use(mdw.methodValidator(allowedMethods));
router.get('/', (req, res, next) => {
    req.formattedResponse = formatResponse(200, 'you are connected to the /api/v0.2/', null);
    next();
})
router.post('/users', UserController.registerUser);
router.post('/users/check', UserController.checkPassword);
router.use(mdw.responseHandler);
router.use(mdw.errorHandler);

module.exports = router;

