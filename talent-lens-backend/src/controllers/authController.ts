import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import User from '../models/User';

type AuthResponseUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: 'recruiter' | 'admin';
};

type TokenPayload = JwtPayload & {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'recruiter' | 'admin';
};

const getJwtSecret = (): string | null => {
  const secret = process.env.JWT_SECRET;
  return secret && secret.trim().length > 0 ? secret : null;
};

const toAuthResponseUser = (user: {
  firstName: string;
  lastName: string;
  email: string;
  role: 'recruiter' | 'admin';
}): AuthResponseUser => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
});

const createToken = (payload: TokenPayload): string | null => {
  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '1d') as jwt.SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
};


export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ message: 'Missing required fields.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const token = createToken({
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });

    if (!token) {
      res.status(500).json({ message: 'JWT configuration is missing.' });
      return;
    }

    res.status(200).json({
      token,
      user: toAuthResponseUser(user),
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Login user error:', error.message);
    } else {
      console.error('Login user error:', error);
    }

    res.status(500).json({ message: 'Failed to log in user.' });
  }
};

