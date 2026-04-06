import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

