import { Schema, model, models, type HydratedDocument, type Model } from 'mongoose';

export type UserRole = 'recruiter' | 'admin';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['recruiter', 'admin'],
      default: 'recruiter',
    },
  },
  {
    timestamps: true,
  },
);

const User = (models.User as Model<IUser>) || model<IUser>('User', userSchema);

export default User;

