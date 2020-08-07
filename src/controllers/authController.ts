import BaseUser from "../models/user/baseUserModel";
import ArisError from "../models/arisErrorModel";
import captcha from "../middlewares/recaptcha";
import User from "../models/user/userModel";
import Data from "../models/dataModel";
import auth from "../middlewares/auth";
import redis from "../services/redis";
import config from "../config";
import argon from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';

import express, { Request, Response, Application } from "express";
const route = express.Router();

route.get("/validate-session", auth, async (req: Request, res: Response) => {
  try {
    return res
      .status(200)
      .send({ success: true, message: "Session validated!" });
  } catch (error) {
    const result = ArisError.errorHandler(error, "Validate session");
    return res.status(result.status).send(result.send);
  }
});

route.post("/register", captcha, async (req: Request, res: Response) => {
  const { name, surname, email, birthday, password } = req.body;
  const user_info = { name, surname, email, birthday, password };

  try {
    Data.validate(user_info, "base_user_register");

    const user = new BaseUser(user_info);

    await user.insert();

    return res.status(200).send({
      success: true,
      message: "Registration complete!",
      user,
    });
  } catch (error) {
    const result = ArisError.errorHandler(error, "Registration");
    return res.status(result.status).send(result.send);
  }
});

route.post("/login", captcha, async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  try {
    Data.validate({ email, password }, "user_login");
    const user = await User.getUser(email);
    if (await argon.verify(user.password, password)) {
      var token: string = "";
      if (config.redis.use) {
        token = uuidv4();
        redis.client?.set(
          `auth.${token}`,
          JSON.stringify({
            id: user.user_id,
            role: user.role,
          })
        );
        if (rememberMe) redis.client?.expire(`auth.${token}`, 2592000);
        else redis.client?.expire(`auth.${token}`, 86400);
      } else {
        if (rememberMe) {
          token = jwt.sign(
            {
              id: user.user_id,
              role: user.role,
            },
            config.jwt.privateKey,
            {
              algorithm: "RS256",
              expiresIn: "24h",
            }
          );
        } else {
          token = jwt.sign(
            {
              id: user.user_id,
              role: user.role,
            },
            config.jwt.privateKey,
            {
              algorithm: "RS256",
              expiresIn: "30d",
            }
          );
        }
      }
      return res.status(200).send({ success: true, token });
    } else {
      return res
        .status(403)
        .send({ success: false, message: "Incorrect password." });
    }
  } catch (error) {
    const result = ArisError.errorHandler(error, "Login");
    return res.status(result.status).send(result.send);
  }
});

route.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    Data.validate({ email }, "forgot_password");

    const ResetPasswordToken = await User.forgotPassword(<string>email);

    return res
      .status(200)
      .send({ success: true, message: "Email sended!", ResetPasswordToken });
  } catch (error) {
    const result = ArisError.errorHandler(error, "Change password");
    return res.status(result.status).send(result.send);
  }
});

route.post("/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body;

  try {
    const result = await User.resetPassword(token, password);

    return res
      .status(200)
      .send({ success: true, message: "Password changed!", ...result });
  } catch (error) {
    const result = ArisError.errorHandler(error, "Change password!");
    return res.status(result.status).send(result.send);
  }
});

export default (app: Application) => app.use("/api", route);
