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

const getGeminiModelNames = (): string[] => {
  const configuredModels = process.env.GEMINI_MODEL
    ?.split(',')
    .map((model) => model.trim())
    .filter((model) => model.length > 0) ?? [];

  return Array.from(
    new Set([
      ...configuredModels,
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash',
    ]),
  );
};

const isGeminiModelNotFoundError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /404/i.test(message) && /(not found|not supported)/i.test(message);
};

const isGeminiQuotaOrRateLimitError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /429/i.test(message) || /quota exceeded/i.test(message) || /too many requests/i.test(message) || /rate limit/i.test(message);
};

const sleep = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const normalizeTextList = (items: string[] | undefined | null): string[] =>
  (items ?? []).map((item) => item.trim()).filter((item) => item.length > 0);

const getEducationScore = (educationLevel: string): number => {
  const value = educationLevel.toLowerCase();

  if (value.includes('phd') || value.includes('doctor')) return 100;
  if (value.includes('master')) return 90;
  if (value.includes('bachelor')) return 80;
  if (value.includes('diploma')) return 65;
  if (value.includes('certificate')) return 55;
  if (value.includes('high school') || value.includes('secondary')) return 40;
  return 60;
};

const getExperienceScore = (yearsOfExperience: number, experienceLevel?: string): number => {
  const target = (experienceLevel ?? '').toLowerCase();
  const targetYears = target.includes('senior') ? 6 : target.includes('mid') ? 3 : target.includes('junior') || target.includes('entry') ? 1 : 3;
  const ratio = Math.min(yearsOfExperience / Math.max(targetYears, 1), 1);
  return Math.round(50 + ratio * 50);
};

const scoreMatchRatio = (matches: number, total: number): number => {
  if (total <= 0) return 60;
  return Math.round((matches / total) * 100);
};

const buildHeuristicScreeningResponse = (job: ScreeningJob, applicant: BatchApplicant): ParsedScreeningResponse => {
  const jobSkills = normalizeTextList(job.requiredSkills);
  const jobRequirements = normalizeTextList(job.requirements);
  const applicantSkills = normalizeTextList(applicant.skills);
  const matchedSkills = jobSkills.filter((skill) => applicantSkills.some((candidate) => candidate.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(candidate.toLowerCase())));
  const matchedRequirements = jobRequirements.filter((requirement) =>
    applicantSkills.some((candidate) => candidate.toLowerCase().includes(requirement.toLowerCase()) || requirement.toLowerCase().includes(candidate.toLowerCase()))
  );

  const skillsScore = scoreMatchRatio(matchedSkills.length, Math.max(jobSkills.length, 1));
  const requirementsScore = scoreMatchRatio(matchedRequirements.length, Math.max(jobRequirements.length, 1));
  const experienceScore = getExperienceScore(applicant.yearsOfExperience, job.description);
  const educationScore = getEducationScore(applicant.educationLevel);
  const relevanceScore = Math.round((skillsScore * 0.45) + (requirementsScore * 0.25) + (experienceScore * 0.2) + (educationScore * 0.1));
  const matchScore = Math.max(0, Math.min(100, Math.round((skillsScore + requirementsScore + experienceScore + educationScore + relevanceScore) / 5)));

  const strengths: string[] = [];
  if (matchedSkills.length > 0) strengths.push(`Matches skills: ${matchedSkills.slice(0, 3).join(', ')}`);
  if (experienceScore >= 70) strengths.push(`Relevant experience level: ${applicant.yearsOfExperience} years`);
  if (educationScore >= 75) strengths.push(`Education level: ${applicant.educationLevel}`);

  const gaps: string[] = [];
  const missingSkills = jobSkills.filter((skill) => !matchedSkills.includes(skill));
  const missingRequirements = jobRequirements.filter((requirement) => !matchedRequirements.includes(requirement));
  if (missingSkills.length > 0) gaps.push(`Missing skills: ${missingSkills.slice(0, 3).join(', ')}`);
  if (missingRequirements.length > 0) gaps.push(`Needs more evidence for: ${missingRequirements.slice(0, 3).join(', ')}`);

  const finalRecommendation: ParsedScreeningResponse['finalRecommendation'] =
    matchScore >= 85 ? 'Strong Hire' : matchScore >= 70 ? 'Hire' : matchScore >= 50 ? 'Maybe' : 'No Hire';

  return {
    matchScore,
    scoreBreakdown: {
      skills: skillsScore,
      experience: experienceScore,
      education: educationScore,
      relevance: relevanceScore,
    },
    strengths,
    gaps,
    reasoning: `${applicant.firstName} ${applicant.lastName} shows a ${finalRecommendation.toLowerCase()} fit for ${job.roleTitle}. The heuristic fallback estimated alignment from skills, experience, and education because Gemini was unavailable.`,
    finalRecommendation,
  };
};

const generateGeminiTextWithFallback = async (apiKey: string, prompt: string): Promise<string | null> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of getGeminiModelNames()) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const aiResponse = await model.generateContent(prompt);
        return aiResponse.response.text();
      } catch (error) {
        lastError = error;

        if (isGeminiModelNotFoundError(error)) {
          break;
        }

        if (!isGeminiQuotaOrRateLimitError(error)) {
          throw error;
        }

        if (attempt === 0) {
          await sleep(1000);
          continue;
        }

        break;
      }
    }
  }

  if (lastError && !isGeminiModelNotFoundError(lastError) && !isGeminiQuotaOrRateLimitError(lastError)) {
    throw lastError instanceof Error
      ? lastError
      : new Error('Unexpected Gemini screening error.');
  }

  return null;
};

const screenBatch = async (
  apiKey: string,
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

  const responseText = await generateGeminiTextWithFallback(apiKey, prompt);

  if (!responseText) {
    return batch.map((applicant) => ({
      applicantId: String(applicant._id),
      ...buildHeuristicScreeningResponse(job, applicant),
    }));
  }

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: 'GEMINI_API_KEY is not configured.' });
      return;
    }

    await ScreeningResult.findOneAndUpdate(
        { jobId, applicantId },
        {
          $set: { status: 'Pending' },
          $setOnInsert: { jobId, applicantId },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    pendingCreated = true;

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
REQUIREMENTS: ${job.requirements?.join(', ') ?? ''}
REQUIRED SKILLS: ${job.requiredSkills?.join(', ') ?? ''}
APPLICANT NAME: ${applicant.firstName} ${applicant.lastName}
APPLICANT SKILLS: ${applicant.skills?.join(', ') ?? ''}
YEARS OF EXPERIENCE: ${applicant.yearsOfExperience}
RESUME / PROFILE DATA: ${getProfileDataText(applicant.profileData)}`;

    const responseText = await generateGeminiTextWithFallback(apiKey, prompt);

    const parsed: ParsedScreeningResponse = responseText
      ? (() => {
          try {
            return JSON.parse(responseText) as ParsedScreeningResponse;
          } catch (parseError) {
            return buildHeuristicScreeningResponse(job, applicant);
          }
        })()
      : buildHeuristicScreeningResponse(job, applicant);

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
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
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
            { returnDocument: 'after' },
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


    const batches: BatchApplicant[][] = [];
    for (let index = 0; index < applicants.length; index += 5) {
      batches.push(applicants.slice(index, index + 5) as BatchApplicant[]);
    }

    const settledBatches = await Promise.allSettled(batches.map((batch) => screenBatch(apiKey, job as ScreeningJob, batch)));

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