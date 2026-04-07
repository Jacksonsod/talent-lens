import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Types } from 'mongoose';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import ScreeningResult from '../models/ScreeningResult';

type ParsedScreeningResponse = {
  matchScore?: number;
  scoreBreakdown?: {
    skills?: number;
    experience?: number;
    education?: number;
    relevance?: number;
  };
  strengths?: string[];
  gaps?: string[];
  reasoning?: string;
  finalRecommendation?: 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire';
};

type ParsedBatchResult = {
  applicantId: string;
  matchScore?: number;
  scoreBreakdown?: {
    skills?: number;
    experience?: number;
    education?: number;
    relevance?: number;
  };
  strengths?: string[];
  gaps?: string[];
  reasoning?: string;
  finalRecommendation?: 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire';
};

type BatchApplicant = {
  _id: { toString(): string };
  firstName: string;
  lastName: string;
  skills?: string[];
  yearsOfExperience: number;
  educationLevel: string;
  currentRole?: string | null;
  profileData?: unknown;
};

type ScreeningJob = {
  roleTitle: string;
  description: string;
  requirements?: string[];
  requiredSkills?: string[];
};

class BatchParseError extends Error {
  applicantIds: string[];

  constructor(message: string, applicantIds: string[]) {
    super(message);
    this.name = 'BatchParseError';
    this.applicantIds = applicantIds;
  }
}

const getUserId = (req: Request): string | null => req.user?.userId ?? null;

const getProfileDataText = (profileData: unknown): string => {
  if (profileData && typeof profileData === 'object' && 'rawResumeText' in profileData) {
    const rawResumeText = (profileData as { rawResumeText?: unknown }).rawResumeText;
    if (typeof rawResumeText === 'string' && rawResumeText.trim().length > 0) {
      return rawResumeText;
    }
  }

  if (profileData !== undefined && profileData !== null) {
    try {
      return JSON.stringify(profileData);
    } catch (error) {
      return 'Not provided';
    }
  }

  return 'Not provided';
};

const sanitizeJson = (text: string): string => text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

const screenBatch = async (
  model: { generateContent(prompt: string): Promise<{ response: { text(): string } }> },
  job: ScreeningJob,
  batch: BatchApplicant[],
): Promise<ParsedBatchResult[]> => {
  if (batch.length === 0) {
    return [];
  }

  const applicantIds = batch.map((applicant) => String(applicant._id));
  const prompt = `You are an expert technical recruiter. Evaluate ALL of the following applicants against the job and return ONLY a raw JSON array (no markdown, no code fences) where each element contains exactly:
{
  applicantId: string,
  matchScore: number (0-100),
  scoreBreakdown: { skills, experience, education, relevance: numbers 0-100 },
  strengths: string[],
  gaps: string[],
  reasoning: string (2-3 sentences),
  finalRecommendation: 'Strong Hire'|'Hire'|'Maybe'|'No Hire'
}
JOB TITLE: ${job.roleTitle}
JOB DESCRIPTION: ${job.description}
REQUIREMENTS: ${job.requirements?.join(', ') ?? ''}
REQUIRED SKILLS: ${job.requiredSkills?.join(', ') ?? ''}

APPLICANTS:
${batch
  .map(
    (applicant, index) => `Applicant ${index + 1}:
- ID: ${String(applicant._id)}
- Name: ${applicant.firstName} ${applicant.lastName}
- Skills: ${applicant.skills?.length ? applicant.skills.join(', ') : 'Not provided'}
- Years of experience: ${applicant.yearsOfExperience}
- Education: ${applicant.educationLevel}
- Current role: ${applicant.currentRole ?? 'Not provided'}
- Profile/Resume: ${getProfileDataText(applicant.profileData)}`,
  )
  .join('\n')}`;

  const aiResponse = await model.generateContent(prompt);
  const responseText = aiResponse.response.text();
  const cleaned = sanitizeJson(responseText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned) as unknown;
  } catch (error) {
    throw new BatchParseError(`Failed to parse Gemini batch response for applicant IDs: ${applicantIds.join(', ')}`, applicantIds);
  }

  if (!Array.isArray(parsed)) {
    throw new BatchParseError(`Gemini batch response was not an array for applicant IDs: ${applicantIds.join(', ')}`, applicantIds);
  }

  const expectedIds = new Set(applicantIds);
  const seenIds = new Set<string>();

  const normalized = parsed.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new BatchParseError(`Gemini batch response contained an invalid item for applicant IDs: ${applicantIds.join(', ')}`, applicantIds);
    }

    const candidate = item as { applicantId?: unknown; matchScore?: number; scoreBreakdown?: ParsedBatchResult['scoreBreakdown']; strengths?: string[]; gaps?: string[]; reasoning?: string; finalRecommendation?: ParsedBatchResult['finalRecommendation'] };
    if (typeof candidate.applicantId !== 'string' || !expectedIds.has(candidate.applicantId)) {
      throw new BatchParseError(`Gemini batch response had a missing or unexpected applicantId for applicant IDs: ${applicantIds.join(', ')}`, applicantIds);
    }

    if (seenIds.has(candidate.applicantId)) {
      throw new BatchParseError(`Gemini batch response contained duplicate applicant results for applicant IDs: ${applicantIds.join(', ')}`, applicantIds);
    }

    seenIds.add(candidate.applicantId);

    return {
      applicantId: candidate.applicantId,
      matchScore: candidate.matchScore,
      scoreBreakdown: candidate.scoreBreakdown,
      strengths: candidate.strengths ?? [],
      gaps: candidate.gaps ?? [],
      reasoning: candidate.reasoning,
      finalRecommendation: candidate.finalRecommendation,
    } satisfies ParsedBatchResult;
  });

  if (normalized.length !== batch.length) {
    throw new BatchParseError(`Gemini batch response returned the wrong number of results for applicant IDs: ${applicantIds.join(', ')}`, applicantIds);
  }

  return normalized;
};

export const screenApplicant = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { jobId, applicantId } = req.params as { jobId?: string; applicantId?: string };
  let pendingCreated = false;

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  if (!jobId || !applicantId) {
    res.status(400).json({ message: 'jobId and applicantId are required.' });
    return;
  }

  try {
    const job = await Job.findById(jobId);

    if (!job) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (String(job.createdBy) !== userId) {
      res.status(403).json({ message: 'You do not have permission to screen applicants for this job.' });
      return;
    }

    const applicant = await Applicant.findById(applicantId);

    if (!applicant) {
      res.status(404).json({ message: 'Applicant not found.' });
      return;
    }

    await ScreeningResult.findOneAndUpdate(
      { jobId, applicantId },
      {
        $set: { status: 'Pending' },
        $setOnInsert: { jobId, applicantId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    pendingCreated = true;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are an expert technical recruiter. Evaluate the following applicant against the job requirements and return ONLY a valid JSON object with exactly these fields:
{
  matchScore: number (0-100),
  scoreBreakdown: {
    skills: number (0-100),
    experience: number (0-100),
    education: number (0-100),
    relevance: number (0-100)
  },
  strengths: string[],
  gaps: string[],
  reasoning: string (2-3 sentences explaining the recommendation),
  finalRecommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire'
}
JOB TITLE: ${job.roleTitle}
JOB DESCRIPTION: ${job.description}
REQUIREMENTS: ${job.requirements.join(', ')}
REQUIRED SKILLS: ${job.requiredSkills.join(', ')}
APPLICANT NAME: ${applicant.firstName} ${applicant.lastName}
APPLICANT SKILLS: ${applicant.skills.join(', ')}
YEARS OF EXPERIENCE: ${applicant.yearsOfExperience}
RESUME / PROFILE DATA: ${getProfileDataText(applicant.profileData)}`;

    const aiResponse = await model.generateContent(prompt);
    const responseText = aiResponse.response.text();

    let parsed: ParsedScreeningResponse;
    try {
      parsed = JSON.parse(responseText) as ParsedScreeningResponse;
    } catch (parseError) {
      await ScreeningResult.findOneAndUpdate(
        { jobId, applicantId },
        {
          $set: {
            status: 'Failed',
            reasoning: 'Failed to parse AI response JSON.',
          },
        },
        { new: true },
      );

      res.status(500).json({ message: 'Failed to parse AI screening response.' });
      return;
    }

    const completedResult = await ScreeningResult.findOneAndUpdate(
      { jobId, applicantId },
      {
        $set: {
          status: 'Completed',
          matchScore: parsed.matchScore,
          scoreBreakdown: parsed.scoreBreakdown,
          strengths: parsed.strengths ?? [],
          gaps: parsed.gaps ?? [],
          reasoning: parsed.reasoning,
          finalRecommendation: parsed.finalRecommendation,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(200).json(completedResult);
  } catch (error) {
    if (pendingCreated) {
      try {
        await ScreeningResult.findOneAndUpdate(
          { jobId, applicantId },
          {
            $set: {
              status: 'Failed',
            },
          },
          { new: true },
        );
      } catch (updateError) {
        // Ignore nested update errors to preserve original failure response.
      }
    }

    if (error instanceof Error) {
      console.error('Screen applicant error:', error.message);
    }

    res.status(500).json({ message: 'Failed to screen applicant.' });
  }
};

export const getJobShortlist = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { jobId } = req.params as { jobId?: string };

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  if (!jobId) {
    res.status(400).json({ message: 'jobId is required.' });
    return;
  }

  try {
    const job = await Job.findById(jobId);

    if (!job) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (String(job.createdBy) !== userId) {
      res.status(403).json({ message: 'You do not have permission to view this shortlist.' });
      return;
    }

    const shortlistSize = job.shortlistSize ?? 10;

    const results = await ScreeningResult.find({ jobId, status: 'Completed' })
      .populate('applicantId')
      .sort({ matchScore: -1 })
      .limit(shortlistSize);

    res.status(200).json({
      jobId,
      shortlistSize,
      count: results.length,
      results,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Get job shortlist error:', error.message);
    }

    res.status(500).json({ message: 'Failed to fetch shortlist.' });
  }
};

export const getScreeningDetail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id?: string };

  if (!id) {
    res.status(400).json({ message: 'Screening result id is required.' });
    return;
  }

  try {
    const screeningResult = await ScreeningResult.findById(id).populate('applicantId').populate('jobId');

    if (!screeningResult) {
      res.status(404).json({ message: 'Screening result not found.' });
      return;
    }

    const populatedJob = screeningResult.jobId as unknown as { createdBy: { toString(): string }; roleTitle: string };

    if (populatedJob.createdBy.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'You do not have permission to view this screening result.' });
      return;
    }

    res.status(200).json(screeningResult);
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Screening result not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Get screening detail error:', error.message);
    }

    res.status(500).json({ message: 'Failed to fetch screening result.' });
  }
};

export const screenAllApplicants = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { jobId } = req.params as { jobId?: string };
  const pendingApplicantIds: string[] = [];
  const completedApplicantIds = new Set<string>();
  let screeningJobObjectId: Types.ObjectId | null = null;

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  if (!jobId) {
    res.status(400).json({ message: 'jobId is required.' });
    return;
  }

  try {
    const job = await Job.findById(jobId);

    if (!job) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    screeningJobObjectId = job._id;
    const currentJobObjectId = screeningJobObjectId;

    if (String(job.createdBy) !== userId) {
      res.status(403).json({ message: 'You do not have permission to screen applicants for this job.' });
      return;
    }

    const applicants = await Applicant.find({ jobId, status: 'pending' }).sort({ createdAt: 1 });

    if (applicants.length === 0) {
      res.status(400).json({ message: 'No pending applicants found for this job' });
      return;
    }

    const applicantIds = applicants.map((applicant) => String(applicant._id));
    pendingApplicantIds.push(...applicantIds);

    await ScreeningResult.bulkWrite(
      applicants.map((applicant) => ({
        updateOne: {
          filter: { jobId: currentJobObjectId, applicantId: applicant._id },
          update: {
            $set: { status: 'Pending' },
            $setOnInsert: { jobId: currentJobObjectId, applicantId: applicant._id },
          },
          upsert: true,
        },
      })),
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: 'GEMINI_API_KEY is not configured.' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const batches: BatchApplicant[][] = [];
    for (let index = 0; index < applicants.length; index += 5) {
      batches.push(applicants.slice(index, index + 5) as BatchApplicant[]);
    }

    const settledBatches = await Promise.allSettled(batches.map((batch) => screenBatch(model, job as ScreeningJob, batch)));

    const failedApplicantIds: string[] = [];

    for (const [index, settled] of settledBatches.entries()) {
      const batch = batches[index];
      const batchApplicantIds = batch.map((applicant) => String(applicant._id));

      if (settled.status === 'fulfilled') {
        await ScreeningResult.bulkWrite(
          settled.value.map((result) => ({
            updateOne: {
              filter: { jobId: currentJobObjectId, applicantId: result.applicantId },
              update: {
                $set: {
                  status: 'Completed',
                  matchScore: result.matchScore,
                  scoreBreakdown: result.scoreBreakdown
                    ? {
                        skills: result.scoreBreakdown.skills ?? 0,
                        experience: result.scoreBreakdown.experience ?? 0,
                        education: result.scoreBreakdown.education ?? 0,
                        relevance: result.scoreBreakdown.relevance ?? 0,
                      }
                    : undefined,
                  strengths: result.strengths ?? [],
                  gaps: result.gaps ?? [],
                  reasoning: result.reasoning,
                  finalRecommendation: result.finalRecommendation,
                },
              },
              upsert: true,
            },
          })),
        );

        settled.value.forEach((result) => completedApplicantIds.add(result.applicantId));
        continue;
      }

      failedApplicantIds.push(...batchApplicantIds);

      await ScreeningResult.bulkWrite(
        batchApplicantIds.map((applicantId) => ({
          updateOne: {
            filter: { jobId: currentJobObjectId, applicantId },
            update: { $set: { status: 'Failed' } },
            upsert: true,
          },
        })),
      );
    }

    if (completedApplicantIds.size > 0) {
      await Applicant.bulkWrite([
        {
          updateMany: {
            filter: { _id: { $in: Array.from(completedApplicantIds) } },
            update: { $set: { status: 'screened' } },
          },
        },
      ]);
    }

    const completedDocs = await ScreeningResult.find({
      jobId: currentJobObjectId,
      applicantId: { $in: Array.from(completedApplicantIds) },
      status: 'Completed',
    })
      .populate('applicantId')
      .sort({ matchScore: -1 });

    res.status(200).json({
      jobId,
      totalScreened: completedDocs.length,
      totalFailed: failedApplicantIds.length,
      results: completedDocs,
    });
  } catch (error) {
    if (screeningJobObjectId && pendingApplicantIds.length > 0) {
      const remainingApplicantIds = pendingApplicantIds.filter((applicantId) => !completedApplicantIds.has(applicantId));

      if (remainingApplicantIds.length > 0) {
        try {
          await ScreeningResult.bulkWrite([
            {
              updateMany: {
                filter: { jobId: screeningJobObjectId, applicantId: { $in: remainingApplicantIds } },
                update: { $set: { status: 'Failed' } },
              },
            },
          ]);
        } catch (cleanupError) {
          // Preserve the original error response.
        }
      }
    }

    if (error instanceof Error) {
      console.error('Screen all applicants error:', error.message);
    }

    res.status(500).json({ message: 'Failed to screen applicants.' });
  }
};

