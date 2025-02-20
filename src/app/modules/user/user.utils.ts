import jwt, { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
export const createToken = (
  jwtPayload: { email: string,rootFolder:Types.ObjectId },
  secret: string,
  expiresIn: string,
) => {
  return jwt.sign(jwtPayload, secret, { expiresIn: expiresIn });
};
export const createSecuredFolderToken = (
  jwtPayload: { email: string,securedrootFolderID:Types.ObjectId },
  secret: string,
  expiresIn: string,
) => {
  return jwt.sign(jwtPayload, secret, { expiresIn: expiresIn });
};

export const createVerifyUserToken = (
  jwtPayload: { email: string},
  secret: string,
  expiresIn: string,
) => {
  return jwt.sign(jwtPayload, secret, { expiresIn: expiresIn });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};