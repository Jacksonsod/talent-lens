declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        role: 'recruiter' | 'admin';
      };
    }
  }
}

export {};