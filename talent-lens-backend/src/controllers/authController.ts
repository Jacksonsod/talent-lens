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

  return jwt.sign(payload, secret, { expiresIn: '1d' });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  };

  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ message: 'Missing required fields.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      res.status(409).json({ message: 'User already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'recruiter',
    });

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

    res.status(201).json({
      token,
      user: toAuthResponseUser(user),
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Register user error:', error.message);
    } else {
      console.error('Register user error:', error);
    }

    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'User already exists.' });
      return;
    }

    res.status(500).json({ message: 'Failed to register user.' });
  }
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

