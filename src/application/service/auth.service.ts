import { v4 as uuidv4 } from "uuid";
import * as jwt from "jwt-simple";
import moment from "moment";
import bcrypt from 'bcrypt';


export default class AuthAppService {
  static generateRefreshToken(): string {
    return uuidv4();
  }

  static generateAccessToken(id: string, name: string, role : string): string {
    const payload = {
      id,
      name,
      role,
      iat: moment().unix(),
      exp: moment().add(process.env.TOKEN_TIMEOUT, "minutes").unix(),
    };

    return jwt.encode(payload, process.env.TOKEN_SECRET_WORD);
  }

  static async cipherPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  static async isMatchPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static validateAccessToken(accessToken: string) {
    return new Promise((resolve, reject) => {
      try {
        const payload = jwt.decode(
          accessToken,
          process.env.TOKEN_SECRET_WORD
        );
        resolve(payload);
      } catch (error: any) {
        if (error.message === "Token expired") {
          reject({ status: 409, message: "The access token has expired" });
        } else {
          reject({ status: 401, message: "The access token is invalid" });
        }
      }
    });
  }
}