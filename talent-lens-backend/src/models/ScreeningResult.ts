import { Schema, model, models, type HydratedDocument, type Model, type Types } from 'mongoose';

export type ScreeningStatus = 'Pending' | 'Completed' | 'Failed';
export type FinalRecommendation = 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire';

export interface IScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  relevance: number;
}

export interface IScreeningResult {
  jobId: Types.ObjectId;
  applicantId: Types.ObjectId;
  status: ScreeningStatus;
  matchScore?: number;
  scoreBreakdown?: IScoreBreakdown;
  strengths: string[];
  gaps: string[];
  reasoning?: string;
  finalRecommendation?: FinalRecommendation;
  createdAt: Date;
  updatedAt: Date;
}

export type ScreeningResultDocument = HydratedDocument<IScreeningResult>;

const scoreBreakdownSchema = new Schema<IScoreBreakdown>(
  {
    skills: { type: Number, min: 0, max: 100 },
    experience: { type: Number, min: 0, max: 100 },
    education: { type: Number, min: 0, max: 100 },
    relevance: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const screeningResultSchema = new Schema<IScreeningResult>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: 'Applicant',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    scoreBreakdown: {
      type: scoreBreakdownSchema,
    },
    strengths: {
      type: [String],
      default: [],
    },
    gaps: {
      type: [String],
      default: [],
    },
    reasoning: {
      type: String,
    },
    finalRecommendation: {
      type: String,
      enum: ['Strong Hire', 'Hire', 'Maybe', 'No Hire'],
    },
  },
  {
    timestamps: true,
  },
);

screeningResultSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

const ScreeningResult =
  (models.ScreeningResult as Model<IScreeningResult>) || model<IScreeningResult>('ScreeningResult', screeningResultSchema);

export default ScreeningResult;

