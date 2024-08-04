const UserModel = require("../Models/UserModel");
const BaseController = require("./BaseController");
const Logging = require("../configs/logger");
const formatResponse = require('../utils/responseFormatter');
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, PasswordError, DuplicateError } = require('../utils/error');

const logger = new Logging('UserController');

class UserController extends BaseController {
    constructor() {
        super();
        this.UserModel = new UserModel();
    }

    normalizeUsernameEmail(username = null, email = null) {
        logger.info('Normalizing username and email');
        let normalizedData = {};
        if (username) {
            normalizedData['username'] = username.toLowerCase();
        }
        if (email) {
            normalizedData['email'] = email.toLowerCase();
        }
        logger.debug(`normalized data: ${JSON.stringify(normalizedData)}`);
        return normalizedData;
    }

    validateEmail(email) {
        logger.debug(`email: ${email}`);
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        logger.debug(`email regex test: ${emailRegex.test(email)}`);
        return emailRegex.test(email);
    }

    async addAdmin(req, res, next) {
        try {
            const { username, email, password, confirmPassword } = req.body;
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            // Ensure the user making this request is an admin
            const currentUser = await this.getCurrentUser(req);
            if (currentUser.role !== 'admin') {
                throw new ForbiddenError('Only admins can add new admins');
            }
            if (password !== confirmPassword) {
                throw new BadRequestError("Passwords don't match");
            }
            delete req.body.confirmPassword;

            // Create new user with admin role
            const newUserData = { username, email, password, memberSince: new Date(), role: 'admin' };
            const newAdmin = await this.UserModel.createUser(newUserData, true);

            res.status(201).json(formatResponse(201, 'Admin created successfully', { id: newAdmin._id }));
        } catch (error) {
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            logger.info('register');
            const { username, email, password, confirmPassword } = req.body;
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            const requiredFields = ['username', 'email', 'password', 'confirmPassword'];
            await this.verifyBody(req.body, requiredFields);
            logger.info('Verifying password matchings');
            if (password != confirmPassword) {
                logger.error('Password do not match');
                throw new BadRequestError("Password don't match");
            }
            logger.info('Verifying email');
            if (!this.validateEmail(email)) {
                logger.error('Invalid email');
                throw new BadRequestError("Invalid email");
            }
            const normalizedData = this.normalizeUsernameEmail(username, email);
            const newUserData = { ...req.body, ...normalizedData, memberSince: new Date(), role: 'user' };
            logger.debug(`newUserData: ${JSON.stringify(newUserData)}`);
            logger.info('Create user...');
            const user = await this.UserModel.createUser(newUserData);
            logger.debug(`user created: ${JSON.stringify(user)}`);
            const createdId = this.UserModel.toStringId(user._id);
            res.status(201).json(formatResponse(201, 'User created successfully', { id: createdId }));
        } catch (error) {
            logger.error(`Error creating user: ${JSON.stringify(error)}`);
            if (error.code === 11000) {
                // Duplicate key error
                next(new DuplicateError());
            }
            next(error);
        }
    }

    async getAllUsers(req, res, next) {
        try {
            logger.info('getAllUsers');
            const users = await this.UserModel.getAllUsers();
            if (users.length === 0) {
                logger.error('No users found');
                return res.status(200).json(formatResponse(200, 'No users found'));
            }
            logger.debug(`users: ${JSON.stringify(users)}`);
            res.status(200).json(formatResponse(200, 'Users found', { users }));
        } catch (error) {
            logger.error(`Error getting all users: ${error.message}`);
            next(error);
        }
    }

    /**
     * Check the password for a given username.
     *
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {Function} next - The next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the password check is complete.
     * @throws {UnauthorizedError} - If the username or password is incorrect.
     */
    async checkPassword(req, res, next) {
        try {
            logger.info('checkPassword');
            let { username, password } = req.body;
            if (!username || !password) {
                throw new BadRequestError('Username and password are required');
            }
            username = username.toLowerCase();
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            const passwordMatch = await this.UserModel.checkPassword(username, password);
            if (!passwordMatch) {
                logger.error('Invalid username or password');
                throw new PasswordError();
            }
            res.status(200).json(formatResponse(200, 'checkPassword pass'));
        } catch (error) {
            logger.error(`Error checkPassword: ${error.message}`);
            next(error);
        }
    }

    //FIXME - getCurrentUser need to call security.js to decode the JWT token
    async getCurrentUser(req) {
        try {
            const currentUser = await security.getCurrentUser(req);
            const userData = await this.UserModel.findById(currentUser._Id);
            return user;
        } catch (error) {
            next(error);
        }
    }

    /**
     * Updates a user's information by ID.
     *
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {Function} next - The next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the user is updated.
     * @throws {BadRequestError} - If the user ID is missing, current password is missing, or new password and confirm new password do not match.
     * @throws {NotFoundError} - If the user is not found.
     * @throws {UnauthorizedError} - If the current password is invalid.
     * @throws {Error} - If there is an error updating the user.
     */
    //FIXME - future plan after getCurrentUser is implemented, update to currentUser instetad of update by Id
    // get id from current
    async updateUser(req, res, next) {
        try {
            logger.info('updateUser');
            const { userId } = req.params;
            if (!userId) {
                throw new BadRequestError("'userId' is required");
            }
            if (!this.UserModel.isValidObjectId(userId)) {
                throw new BadRequestError('Invalid userId');
            }
            const { currentPassword, newPassword, confirmNewPassword, newUsername, newEmail } = req.body;
            // Verify that the current password is provided
            if (!currentPassword) {
                throw new BadRequestError("'currentPassword' is required to update user information");
            }
            // Verify the current password
            const passwordMatch = await this.UserModel.checkPassword(user.username, currentPassword);
            if (!passwordMatch) {
                logger.error('Invalid username or password');
                throw new PasswordError();
            }
            if (!newPassword && !newUsername && !newEmail) {
                throw new BadRequestError('At least one field is required to update user information');
            }
            //FIXME - waiting for getCurrentUser to be implemented
            /*NOTE - getCurrentUser is decode the JWT token and return the user data
            * we need to check if the user is authorized to update the user data*/
            // const user = await this.getCurrentUser(req);
            // const userid = user._id;
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            const user = await this.UserModel.findById(userId);

            if (!user) {
                logger.error('User not found');
                throw new NotFoundError('User not found');
            }
            logger.debug(`user found: ${JSON.stringify(user)}`);

            // Verify that the new password and confirm new password match
            if (newPassword !== confirmNewPassword) {
                throw new BadRequestError('New password and confirm new password do not match');
            }
            if (!this.validateEmail(email)) {
                logger.error('Invalid email');
                throw new BadRequestError("Invalid email");
            }

            const normalizedData = this.normalizeUsernameEmail(newUsername, newEmail);
            const updateFields = { ...normalizedData };
            if (newPassword) updateFields.password = newPassword;
            logger.debug(`Fields and datas to be updated: ${JSON.stringify(updateFields)}`);
            const updatedUser = await this.UserModel.updateById(user._id, updateFields);
            logger.debug(`updated User: ${JSON.stringify(updatedUser)}`);
            res.status(200).json(formatResponse(200, 'User updated successfully', { updatedUser: updatedUser }));
        } catch (error) {
            logger.error(`Error updating user: ${error.message}`);
            if (error.code === 11000) {
                // Duplicate key error
                next(new DuplicateError());
            }
            next(error);
        }
    }

    //FIXME - future plan after getCurrentUser is implemented, delete currentUser instetad of delete by Id
    // get id from current
    async deleteUser(req, res, next) {
        try {
            logger.info('deleteUser');
            // const user = await this.getCurrentUser(req);
            // const userid = user.id
            const { userId } = req.params;
            logger.info('Verifying userId');
            if (!userId) {
                throw new BadRequestError("'userId' is required");
            }
            if (!this.UserModel.isValidObjectId(userId)) {
                throw new BadRequestError('Invalid userId');
            }
            const { currentPassword } = req.body;
            if (!currentPassword) {
                throw new BadRequestError("'currentPassword' is required to delete user");
            }
            const user = await this.UserModel.findById(userId);
            if (!user) {
                logger.error('User not found');
                throw new NotFoundError('User not found');
            }
            logger.debug(`user found: ${JSON.stringify(user)}`);
            const passwordMatch = await this.UserModel.checkPassword(user.username, currentPassword);
            if (!passwordMatch) {
                logger.error('Invalid username or password');
                throw new PasswordError();
            }
            const deletedUser = await this.UserModel.deleteById(userId);
            logger.debug(`deleted user: ${JSON.stringify(deletedUser)}`);
            res.status(200).json(formatResponse(200, 'User deleted successfully', { userId: deletedUser._id }));
        } catch (error) {
            logger.error(`Error deleting user: ${error.message}`);
            next(error);
        }
    }
}

module.exports = UserController;