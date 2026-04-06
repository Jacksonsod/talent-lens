import { Schema, model, models, type HydratedDocument, type Model, type Types } from 'mongoose';

export type ApplicantSource = 'Umurava' | 'External';
export type ApplicantStatus = 'pending' | 'screened' | 'shortlisted' | 'rejected';

export interface IApplicant {
  jobId: Types.ObjectId;
  source: ApplicantSource;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  skills: string[];
  yearsOfExperience: number;
  educationLevel: string;
  currentRole?: string;
  profileData?: unknown;
  resumeUrl?: string;
  status: ApplicantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicantDocument = HydratedDocument<IApplicant>;

const applicantSchema = new Schema<IApplicant>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['Umurava', 'External'],
      required: true,
    },
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
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      required: true,
    },
    educationLevel: {
      type: String,
      required: true,
      trim: true,
    },
    currentRole: {
      type: String,
      trim: true,
    },
    profileData: {
      type: Schema.Types.Mixed,
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'screened', 'shortlisted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

applicantSchema.index({ jobId: 1, email: 1 }, { unique: true });

const Applicant = (models.Applicant as Model<IApplicant>) || model<IApplicant>('Applicant', applicantSchema);

export default Applicant;

