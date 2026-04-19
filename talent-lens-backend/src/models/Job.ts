import { Schema, model, models, type HydratedDocument, type Model, type Types } from 'mongoose';

export type JobStatus = 'Draft' | 'Open' | 'Screening' | 'Closed';

export interface IJob {
  createdBy: Types.ObjectId;
  roleTitle: string;
  description: string;
  requirements: string[];
  requiredSkills: string[];
  experienceLevel: string;
  shortlistSize: number;
  externalPostingUrl: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type JobDocument = HydratedDocument<IJob>;

const jobSchema = new Schema<IJob>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roleTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    experienceLevel: {
      type: String,
      required: true,
      trim: true,
    },
    shortlistSize: {
      type: Number,
      min: 1,
      default: 10,
    },
    externalPostingUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Open', 'Screening', 'Closed'],
      default: 'Draft',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({ createdBy: 1, status: 1 });

const Job = (models.Job as Model<IJob>) || model<IJob>('Job', jobSchema);

export default Job;

