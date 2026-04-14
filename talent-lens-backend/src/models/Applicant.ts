import { Schema, model, models, type HydratedDocument, type Model, type Types } from 'mongoose';

export type ApplicantSource = 'Umurava' | 'External';
export type ApplicantStatus = 'pending' | 'screened' | 'shortlisted' | 'rejected';

export interface ApplicantSkill {
  name: string;
  level: string;
  yearsOfExperience: number;
}

export interface ApplicantLanguage {
  name: string;
  proficiency: string;
}

export interface ApplicantExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
  isCurrent: boolean;
}

export interface ApplicantEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
}

export interface ApplicantCertification {
  name: string;
  issuer: string;
  issueDate: string;
}

export interface ApplicantProject {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link: string;
  startDate: string;
  endDate: string;
}

export interface ApplicantAvailability {
  status: string;
  type: string;
  startDate: string;
}

export interface ApplicantSocialLinks {
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface IApplicant {
  jobId: Types.ObjectId;
  source: ApplicantSource;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: ApplicantSkill[];
  languages: ApplicantLanguage[];
  experience: ApplicantExperience[];
  education: ApplicantEducation[];
  certifications: ApplicantCertification[];
  projects: ApplicantProject[];
  availability: ApplicantAvailability;
  socialLinks: ApplicantSocialLinks;
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

const applicantAvailabilitySchema = new Schema<ApplicantAvailability>(
  {
    status: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

const applicantSocialLinksSchema = new Schema<ApplicantSocialLinks>(
  {
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
    portfolio: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

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
      default: '',
    },
    headline: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    skills: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            default: '',
          },
          level: {
            type: String,
            trim: true,
            default: '',
          },
          yearsOfExperience: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
    languages: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            default: '',
          },
          proficiency: {
            type: String,
            trim: true,
            default: '',
          },
        },
      ],
      default: [],
    },
    experience: {
      type: [
        {
          company: {
            type: String,
            trim: true,
            default: '',
          },
          role: {
            type: String,
            trim: true,
            default: '',
          },
          startDate: {
            type: String,
            trim: true,
            default: '',
          },
          endDate: {
            type: String,
            trim: true,
            default: '',
          },
          description: {
            type: String,
            trim: true,
            default: '',
          },
          technologies: {
            type: [String],
            default: [],
          },
          isCurrent: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },
    education: {
      type: [
        {
          institution: {
            type: String,
            trim: true,
            default: '',
          },
          degree: {
            type: String,
            trim: true,
            default: '',
          },
          fieldOfStudy: {
            type: String,
            trim: true,
            default: '',
          },
          startYear: {
            type: Number,
            default: 0,
          },
          endYear: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
    certifications: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            default: '',
          },
          issuer: {
            type: String,
            trim: true,
            default: '',
          },
          issueDate: {
            type: String,
            trim: true,
            default: '',
          },
        },
      ],
      default: [],
    },
    projects: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            default: '',
          },
          description: {
            type: String,
            trim: true,
            default: '',
          },
          technologies: {
            type: [String],
            default: [],
          },
          role: {
            type: String,
            trim: true,
            default: '',
          },
          link: {
            type: String,
            trim: true,
            default: '',
          },
          startDate: {
            type: String,
            trim: true,
            default: '',
          },
          endDate: {
            type: String,
            trim: true,
            default: '',
          },
        },
      ],
      default: [],
    },
    availability: {
      type: applicantAvailabilitySchema,
      default: () => ({
        status: '',
        type: '',
        startDate: '',
      }),
    },
    socialLinks: {
      type: applicantSocialLinksSchema,
      default: () => ({
        linkedin: '',
        github: '',
        portfolio: '',
      }),
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
      default: {},
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

