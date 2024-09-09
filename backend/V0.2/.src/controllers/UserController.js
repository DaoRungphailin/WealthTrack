require('dotenv').config();
const Utils = require('../utilities/Utils');
const User = require('../models/UserModel');
const BaseController = require('./BaseController');
const logger = Utils.Logger('UserController');
const {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    MethodNotAllowedError,
    ConflictError,
    PasswordError,
    UserDuplicateError
} = require('../utilities/AppErrors');
const { formatResponse } = Utils;

class UserController extends BaseController {
    constructor() {
        super();
        this.User = new User();
    }

    normalizeUsernameEmail = (username = null, email = null) => {
        logger.info('Normalizing username and email');
        logger.debug(`before norm username: ${username}, email: ${email}`);
        let normalizedData = {};
        if (username) {
            normalizedData['username'] = username.toLowerCase();
        }
        if (email) {
            normalizedData['email'] = email.toLowerCase();
        }
        logger.debug(`normalized data: ${JSON.stringify(normalizedData)}`);
        return normalizedData;
    };

    validateEmail = (email) => {
        logger.info('validateEmail');
        logger.debug(`email: ${email}`);
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        logger.debug(`email regex test: ${emailRegex.test(email)}`);
        return emailRegex.test(email);
    };

    registerUser = async (req, res, next) => {
        try {
            const { username, email, password, confirm_password } = req.body;
            logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);

            // Verify all required fields
            super.verifyField(req.body, ['national_id', 'username', 'email', 'password', 'confirm_password']);

            // Check if passwords match
            if (password !== confirm_password) {
                throw new BadRequestError('Password and confirm password do not match');
            }
            logger.info('password and confirm password match');

            // Validate email format
            if (!this.validateEmail(email)) {
                throw new BadRequestError('Invalid email address');
            }

            // Normalize data
            let normalizedData = this.normalizeUsernameEmail(username, email);
            normalizedData = {
                ...req.body,
                ...normalizedData,
                role: 'user',
                member_since: new Date().toISOString(),
            };
            delete normalizedData['confirm_password'];
            logger.debug(`combined normalized data: ${JSON.stringify(normalizedData)}`);

            // Create user
            const createdUser = await this.User.createUser(normalizedData);
            logger.debug(`createdUser: ${JSON.stringify(createdUser)}`);

            // Success response
            req.formattedResponse = formatResponse(201, 'User created successfully', createdUser);
            next();
        } catch (error) {
            logger.error(`Error registering user: ${error.message}`);
            if (error.message.includes('Missing required field: ')) {
                next(new BadRequestError(error.message));
            }
            if (error.message === 'duplicate key value') {
                next(new UserDuplicateError());
            }
            if (error.name === 'ValidationError') {
                // next(new BadRequestError('invalid input'));
                next(new BadRequestError(error.message));
            }
            // Handle specific validation errors
            // if (error.message === 'invalid national_id length' ||
            //     error.message === 'National ID must be 13 characters long.' ||
            //     error.message === 'National ID should contain only numbers.') {
            //     next(new BadRequestError('National ID length is invalid'));
            // } else if (error.message === 'duplicate key value') {
            //     next(new UserDuplicateError());
            // } else if (error.message === 'Username cannot contain special characters.') {
            //     next(new BadRequestError('username invalid'));
            // } else if (error.message === 'Role cannot contain special characters.') {
            //     next(new BadRequestError('role invalid'));
            // }
            // else {
            //     next(error);
            // }

            next(error);
        }
    };

    checkPassword = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);
            super.verifyField(req.body, ['email', 'password']);
            const normalizedEmail = this.normalizeUsernameEmail(null, email);
            const result = await this.User.checkPassword(normalizedEmail['email'], password);
            logger.debug(`Password check result: ${result}`);
            if (!result) throw new PasswordError();
            req.formattedResponse = formatResponse(200, 'Password check successful', result);
            next();
        }
        catch (error) {
            if (error.message.includes('Missing required field: ')) {
                next(new BadRequestError(error.message));
            }
            if (error.name === 'ValidationError') {
                // next(new BadRequestError('invalid input'));
                next(new BadRequestError(error.message));
            }
            next(error);
        }
    }
}

module.exports = UserController;
