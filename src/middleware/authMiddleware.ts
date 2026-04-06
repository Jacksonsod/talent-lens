import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export type AuthTokenPayload = JwtPayload & {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'recruiter' | 'admin';
};

// This tells TypeScript that every Express Request object might have a `user` property
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

// The authorizationHeader is typed strictly as a string
const getTokenFromHeader = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const token = getTokenFromHeader(req.headers.authorization);
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    res.status(401).json({ message: 'Not authorized. Token missing or invalid.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthTokenPayload;

    req.user = {
      userId: decoded.userId,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized. Token missing or invalid.' });
  }
};