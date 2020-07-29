import User from "../../src/models/user/userModel";
import app from "../../src/server";
import db from "../../src/database";
import request from "supertest";
import jwt from "jsonwebtoken";

describe("Authentication", () => {
  afterAll(async () => {
    const ids = await db("user")
      .select("id_user")
      .whereIn("email", ["test@hotmail.com", "test2@hotmail.com"])
      .then((row) => row.map((user) => user.id_user));
    await db("role_user").del().whereIn("user_id", ids);
    await db("user").del().whereIn("id_user", ids);
    await db("address").del().where({ address: "test", zip_code: "test" });
  });

  test("Should created a user with valid credentials", async () => {
    const response = await request(app).post("/register").send({
      city: "São Paulo",
      address: "test",
      zip_code: "test",
      name: "Test",
      sur_name: "test",
      phone: "test",
      email: "test@hotmail.com",
      password: "test",
      role: "professor",
    });

    expect(response.status).toBe(200);
    expect(response.body.Success).toBe(true);
  });

  test("Shouldn´t created a user with an already existing address", async () => {
    const response = await request(app).post("/register").send({
      city: "São Paulo",
      address: "test",
      zip_code: "test",
      name: "Test2",
      sur_name: "test2",
      phone: "test2",
      email: "test2@hotmail.com",
      password: "test2",
      role: "customer",
    });

    expect(response.status).toBe(200);
    expect(response.body.Success).toBe(true);
    expect(response.body).toHaveProperty("access_token");
  });

  test("Shouldn´t create a user that already exists", async () => {
    const response = await request(app).post("/register").send({
      city: "São Paulo",
      address: "test",
      zip_code: "test",
      name: "Test",
      sur_name: "test",
      phone: "test",
      email: "test@hotmail.com",
      password: "test",
      role: "professor",
    });

    expect(response.status).toBe(400);
    expect(response.body.Success).toBe(false);
    expect(response.body).toHaveProperty("Error");
  });

  test("Shouldn´t create a user with invalid credentials", async () => {
    const response1 = await request(app).post("/register").send({
      city: "test",
      address: "test",
      zip_code: "test",
      name: null,
      sur_name: 58,
      phone: 4465,
      email: "testhotmail",
      password: null,
      role: "wrong",
    });

    expect(response1.status).toBe(400);
    expect(response1.body.Success).toBe(false);
    expect(response1.body.Error).toHaveProperty(["email"]);
    expect(response1.body.Error).toHaveProperty(["name"]);
    expect(response1.body.Error).toHaveProperty(["sur_name"]);
    expect(response1.body.Error).toHaveProperty(["phone"]);
    expect(response1.body.Error).toHaveProperty(["password"]);
    expect(response1.body.Error).toHaveProperty(["role"]);

    const response2 = await request(app).post("/register").send({
      city: null,
      address: 687,
      zip_code: 453,
      name: "test",
      sur_name: "test",
      phone: "test",
      email: "test@hotmail.com",
      password: "test",
      role: "student",
    });

    expect(response2.status).toBe(400);
    expect(response2.body.Success).toBe(false);
    expect(response2.body.Error).toHaveProperty(["city"]);
    expect(response2.body.Error).toHaveProperty(["address"]);
    expect(response2.body.Error).toHaveProperty(["zip_code"]);
  });

  test("Shouldn´t login with invalid password", async () => {
    const response = await request(app)
      .get("/login")
      .auth("test@hotmail.com", "wrongPassword", { type: "basic" });

    expect(response.status).toBe(403);
    expect(response.body.Success).toBe(false);
    expect(response.body).toHaveProperty("Error");
    expect(response.body.Error).toBe("Wrong password");
  });

  test("Shouldn´t login with invalid email", async () => {
    const response = await request(app)
      .get("/login")
      .auth("wrong@hotmail.com", "test", { type: "basic" });

    expect(response.status).toBe(403);
    expect(response.body.Success).toBe(false);
    expect(response.body).toHaveProperty("Error");
  });

  test("Should login with valid credentials", async () => {
    const response = await request(app)
      .get("/login")
      .auth("test@hotmail.com", "test", { type: "basic" });

    expect(response.status).toBe(200);
    expect(response.body.Success).toBe(true);
  });

  test("Shouldn´t receive Reset JWT with invalid email", async () => {
    const response = await request(app).get(
      "/forgot-password?email=wrongEmail"
    );

    expect(response.status).toBe(400);
    expect(response.body.Success).toBe(false);
    expect(response.body.Error).toHaveProperty("email");
  });

  test("Shouldn´t change password with invalid token", async () => {
    const response = await request(app).patch("/reset-password").send({
      token: "wrong token",
      password: "test2",
    });

    expect(response.status).toBe(401);
    expect(response.body.Error).toBe("Invalid token signature!");
  });

  test("Shouldn´t change password with expired token", async () => {
    const id = await User.exist("test@hotmail.com");
    const token = jwt.sign({ id }, <string>process.env.JWT_RESET_SECRET, {
      expiresIn: "1ms",
    });

    setTimeout(() => {}, 1000);

    const response = await request(app).patch("/reset-password").send({
      token,
      password: "test2",
    });

    expect(response.status).toBe(401);
    expect(response.body.Error).toBe("Token expired!");
  });

  test("Should change password with valid credentials", async () => {
    const response1 = await request(app).get(
      "/forgot-password?email=test@hotmail.com"
    );

    expect(response1.status).toBe(200);
    expect(response1.body.Success).toBe(true);
    expect(response1.body).toHaveProperty("ResetPasswordToken");

    const response2 = await request(app).patch("/reset-password").send({
      token: response1.body.ResetPasswordToken,
      password: "test2",
    });

    expect(response2.body.Success).toBe(true);
    expect(response2.status).toBe(200);
  });
});
