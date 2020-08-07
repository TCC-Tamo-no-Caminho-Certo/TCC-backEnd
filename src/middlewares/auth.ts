import { Request, Response, NextFunction } from "express";
import config from "../config";
import jwt from "jsonwebtoken";
import redis from "../services/redis";

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

var middleware: MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => { next(); };

if (config.redis.use) {
  middleware = (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth)
      return res
        .status(403)
        .json({ success: false, message: "No token provided!" });
    const parts = auth.split(" ");
    if (parts.length !== 2)
      return res.status(403).json({ success: false, message: "Token error!" });
    const [bearer, token] = parts;
    if (!/^Bearer$/i.test(bearer) || token.length != 50)
      return res
        .status(403)
        .json({ success: false, message: "Token malformated!" });
    redis.client?.get(`auth.${token}`, function (err, reply) {
      if(reply != null) {
        console.log(err);
        console.log(reply);
        var data = JSON.parse(reply);
        req.body._user_id = data.id;
        req.body._role = data.role;
        next();
      } else return res
      .status(403)
      .json({ success: false, message: "Token data error!" });
    });
  };
} else {
  middleware = (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth)
      return res
        .status(403)
        .json({ success: false, message: "No token provided!" });
    const parts = auth.split(" ");
    if (parts.length !== 2)
      return res.status(403).json({ success: false, message: "Token error!" });
    const [bearer, token] = parts;
    if (!/^Bearer$/i.test(bearer))
      return res
        .status(403)
        .json({ success: false, message: "Token malformated!" });
    jwt.verify(
      token,
      config.jwt.publicKey,
      { algorithms: ["RS256"] },
      (err, decoded) => {
        if (err)
          return err.name === "TokenExpiredError"
            ? res
                .status(403)
                .json({ success: false, message: "Token expired!" })
            : res
                .status(403)
                .json({ success: false, message: "Invalid token!" });
        req.body._user_id = (<any>decoded).id;
        req.body._role = (<any>decoded).role;
        next();
      }
    );
  };
}

export default middleware;
