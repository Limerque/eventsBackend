const request = require("supertest");
const mongoose = require("mongoose");
const app = require("./index");

// Set the port for the test server
const port = 5002;
let server;

// Connect to a test database
beforeAll(async () => {
  await mongoose.connect(
    "mongodb+srv://vanrooyenlimerique:Limie2004@cluster0.mxekmwh.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  server = app.listen(port, () => {
    console.log(`Test server listening on port ${port}`);
  });
});

// Clear the test database before each test
beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

// Close the database connection and test server after all tests are done
afterAll(async () => {
  await mongoose.connection.close();
  await server.close();
});

describe("API Routes", () => {
  describe("POST /signup", () => {
    it("should create a new user", async () => {
      const response = await request(app).post("/signup").send({
        email: "test@example.com",
        password: "password",
        isAdmin: false,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Signup successful");
    });
  });

  describe("POST /login", () => {
    it("should log in a user with valid credentials", async () => {
      // Create a test user in the database
      await request(app).post("/signup").send({
        email: "test@example.com",
        password: "password",
        isAdmin: false,
      });

      const response = await request(app)
        .post("/login")
        .send({ email: "test@example.com", password: "password" });

      expect(response.statusCode).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.isAdmin).toBe(false);
    });

    it("should return an error with invalid credentials", async () => {
      const response = await request(app)
        .post("/login")
        .send({ email: "invalid@example.com", password: "password" });

      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe("Invalid email or password");
    });
  });
});
