const request = require("supertest");
const app = require("../app");
const pgClient = require("../services/PgClient");
const { test: testConfig } = require("../configs/dbConfigs");
const Utils = require("../utilities/Utils");
const PgClient = require("../services/PgClient");
const { Logger, formatResponse } = Utils;
const logger = Logger("users.test");

const newUserBody = [
  {
    testName: "id < 13",
    body: {
      national_id: "32109876543",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // id < 13
  {
    testName: "id > 13",
    body: {
      national_id: "3210987654321567",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // id > 13
  {
    testName: "missing national_id field",
    body: {
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // missing national_id field
  {
    testName: "missing username field",
    body: {
      national_id: "0000000000000",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // missing username field
  {
    testName: "missing email field",
    body: {
      national_id: "0000000000001",
      username: "testuser",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // missing email field
  {
    testName: "missing password field",
    body: {
      national_id: "0000000000002",
      username: "testuser",
      email: "testii@example.com",
      confirm_password: "Password123!",
    },
  }, // missing password field
  {
    testName: "missing confirm_password field",
    body: {
      national_id: "0000000000003",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
    },
  }, // missing confirm_password field
  {
    testName: "missing all fields",
    body: {},
  }, // missing all fields
  {
    testName: "empty national_id value",
    body: {
      national_id: "",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // empty national_id value
  {
    testName: "empty username value",
    body: {
      national_id: "0000000000004",
      username: "",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // empty username value
  {
    testName: "empty email value",
    body: {
      national_id: "0000000000005",
      username: "testuser",
      email: "",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // empty email value
  {
    testName: "empty password value",
    body: {
      national_id: "0000000000006",
      username: "testuser",
      email: "testii@example.com",
      password: "",
      confirm_password: "Password123!",
    },
  }, // empty password value
  {
    testName: "empty confirm_password value",
    body: {
      national_id: "0000000000007",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "",
    },
  }, // empty confirm_password value
  {
    testName: "all field empty",
    body: {
      national_id: "",
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  }, // all field empty
  {
    testName: "invalid national_id",
    body: {
      national_id: "esdrfy786",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // invalid national_id
  {
    testName: "invalid username",
    body: {
      national_id: "0000000000008",
      username: "testuser123<>?",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // invalid username
  {
    testName: "invalid email",
    body: {
      national_id: "0000000000009",
      username: "testuser",
      email: "testii@example.com123",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // invalid email
  {
    testName: "invalid password < 8",
    body: {
      national_id: "0000000000010",
      username: "testuser",
      email: "testii@example.com",
      password: "12345",
      confirm_password: "12345",
    },
  }, // invalid password < 8
  {
    testName: "mis match confirm_password",
    body: {
      national_id: "0000000000011",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!123",
    },
  }, // mis match confirm_password
  {
    testName: "success",
    body: {
      national_id: "0000000000012",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, //success
  {
    testName: "email already exists",
    body: {
      national_id: "0000000000013",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // email already exists
  {
    testName: "national_id already exists",
    body: {
      national_id: "0000000000012",
      username: "testuser",
      email: "test2@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
  }, // national_id already exists
];
const checkPassBody = [
  {
    testName: "missing password field",
    body: { email: "testii@example.com" },
  }, // missing password field
  {
    testName: "missing email field",
    body: { password: "Password123!" },
  }, // missing email field
  {
    testName: "missing email value",
    body: { email: "", password: "Password123!" },
  }, // missing email value
  {
    testName: "missing password value",
    body: { email: "testii@example.com", password: "" },
  }, // missing password value
  {
    testName: "incorrect password",
    body: { email: "testii@example.com", password: "Password123!123" },
  }, // incorrect password
  {
    testName: "success",
    body: { email: "testii@example.com", password: "Password123!" },
  }, //success
  {
    testName: "missing both value",
    body: { email: "", password: "" },
  }, // missing both value
  {
    testName: "invalid email",
    body: { email: "testii@example.com123", password: "Password123!" },
  }, // invalid email
];

beforeAll(async () => {
  await pgClient.init();
  logger.debug(`Database connected: ${pgClient.isConnected()}`);
});

afterAll(async () => {
  // Clean up the database after all tests
  logger.info("Dropping tables");

  await Promise.all([
    pgClient
      .query("DELETE FROM transaction_bank_account_relations;")
      .then(() =>
        logger.info("DELETE all rows from table: transaction_bank_account_relations")
      ),
    pgClient
      .query("DELETE FROM transactions;")
      .then(() => logger.info("DELETE all rows from table: transactions")),
    pgClient
      .query("DELETE FROM debts;")
      .then(() => logger.info("DELETE all rows from table: debts")),
    pgClient
      .query("DELETE FROM bank_accounts;")
      .then(() => logger.info("DELETE all rows from table: bank_accounts")),
    pgClient
      .query("DELETE FROM financial_institutions;")
      .then(() => logger.info("DELETE all rows from table: financial_institutions")),
    pgClient
      .query("DELETE FROM users;")
      .then(() => logger.info("DELETE all rows from table: users")),
    pgClient
      .query("DELETE FROM api_request_limits;")
      .then(() => logger.info("DELETE all rows from table: api_request_limits")),
  ]);

  await pgClient.release();
  logger.debug(`Database disconnected: ${pgClient.isConnected()}`);
});

describe("Users Endpoints", () => {
  describe("connection to api", () => {
    describe("GET /health", () => {
      it("should return 200 OK text", async () => {
        const response = await request(app).get("/health").expect(200);

        expect(response.text).toEqual("OK");
      });
    });
    describe("GET /api", () => {
      it("should return 200 OK formatted message", async () => {
        const response = await request(app).get("/api").expect(200);

        expect(response.headers["content-type"]).toEqual(
          expect.stringContaining("json")
        );
        expect(response.body).toHaveProperty("status_code", 200);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toMatch(
          /^you are connected to the \/api, running in Environment: .+/
        );
      });
    });
    describe("GET /api/v0.2/", () => {
      it("should return 200 OK formatted message", async () => {
        const response = await request(app).get("/api/v0.2/");

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toEqual(
          expect.stringContaining("json")
        );
        expect(response.body).toHaveProperty("status_code", 200);
        expect(response.body).toHaveProperty(
          "message",
          "you are connected to the /api/v0.2/"
        );
      });
    });
  });

  describe("POST /api/v0.2/users", () => {
    newUserBody.forEach((user, i) => {
      it(`${i + 1}. ${user.testName}`, async () => {
        logger.info(`Test ${i + 1}. ${user.testName}`);
        const response = await request(app)
          .post("/api/v0.2/users")
          .send(user.body);

        const expectedStatusCode = user.testName.includes("success")
          ? 201
          : user.testName.includes("already exists")
            ? 409
            : 400;

        const expectedMessage = user.testName.includes("success")
          ? "User created successfully"
          : user.testName.includes("missing") || user.testName.includes("empty")
            ? "Missing required field"
            : user.testName.includes("id < 13") ||
              user.testName.includes("id > 13") ||
              user.testName.includes("invalid national_id")
              ? "National ID must be 13 characters long."
              : user.testName.includes("invalid email")
                ? "Invalid email address"
                : user.testName.includes("invalid username")
                  ? "Username must contain only alphanumeric characters."
                  : user.testName.includes("invalid password < 8")
                    ? "Password must be at least 8 characters long"
                    : user.testName.includes("mis match confirm_password")
                      ? "Passwords do not match"
                      : user.testName.includes("already exists")
                        ? "national_id or email are already taken"
                        : "Invalid request";

        expect(response.statusCode).toBe(expectedStatusCode);
        expect(response.body).toHaveProperty("status_code", expectedStatusCode);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toMatch(expectedMessage);
        if (user.testName.includes("success")) {
          expect(response.body.data).toHaveProperty(
            "national_id",
            user.body.national_id
          );
          expect(response.body.data).toHaveProperty("email", user.body.email);
        }
      });
    });
  });

  describe("POST /api/v0.2/users/check", () => {
    checkPassBody.forEach((check, i) => {
      it(`${i + 1}. ${check.testName}`, async () => {
        logger.info(`Test ${i + 1}. ${check.testName}`);
        const response = await request(app)
          .post("/api/v0.2/users/check")
          .send(check.body);

        if (check.testName.includes("success")) {
          expect(response.statusCode).toBe(200);
          expect(response.body).toHaveProperty("status_code", 200);
          expect(response.body).toHaveProperty(
            "message",
            "Password check successful"
          );
          expect(response.body.data).toBe(true);
        } else if (check.testName.includes("Invalid email")) {
          expect(response.statusCode).toBe(400);
          expect(response.body).toHaveProperty("status_code", 400);
          expect(response.body.message).toMatch(/Invalid email format/);
        } else if (check.testName.includes("incorrect password")) {
          expect(response.statusCode).toBe(401);
          expect(response.body).toHaveProperty("status_code", 401);
          expect(response.body.message).toMatch(/Invalid email or password/);
        } else {
          // Handle missing fields or incorrect credentials
          expect(response.statusCode).toBe(400);
          expect(response.body).toHaveProperty("status_code", 400);
          expect(response.body).toHaveProperty("message");
          if (!check.body.email) {
            expect(response.body.message).toMatch(
              /Missing required field: email/
            );
          } else if (!check.body.password) {
            expect(response.body.message).toMatch(
              /Missing required field: password/
            );
          }
        }
      });
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
