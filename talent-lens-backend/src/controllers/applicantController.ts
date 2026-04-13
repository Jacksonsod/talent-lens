import axios from 'axios';
import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFParse } from 'pdf-parse';
import Applicant from '../models/Applicant';
import Job from '../models/Job';

type ExtractedApplicantPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  skills?: unknown[];
  yearsOfExperience?: number;
  educationLevel?: string;
  currentRole?: string;
};

const sanitizeJson = (text: string): string => text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

const parseProfileData = (profileData: unknown): Record<string, unknown> => {
  if (!profileData || typeof profileData !== 'object' || Array.isArray(profileData)) {
    return {};
  }

  return { ...(profileData as Record<string, unknown>) };
};

const normalizeString = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const normalizeSkills = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
};

const normalizeYearsOfExperience = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return 0;
};

const coerceYearsOfExperience = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const buildSafeEmail = (jobId: string, indexHint?: number): string => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${typeof indexHint === 'number' ? `-${indexHint}` : ''}`;
  return `fake-email-${jobId}-${uniqueSuffix}@example.com`;
};

const buildFallbackApplicantData = (jobId: string, indexHint?: number) => ({
  firstName: 'Unknown',
  lastName: 'Candidate',
  email: buildSafeEmail(jobId, indexHint),
  phone: '',
  skills: [],
  yearsOfExperience: 0,
  educationLevel: 'Other',
  currentRole: '',
});

const getEnvNumber = (key: string, fallback: number): number => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

type OwnershipCheckResult =
  | { allowed: true }
  | { allowed: false; status: 403 | 404; message: string };

const checkJobOwnership = async (jobId: string, userId: string): Promise<OwnershipCheckResult> => {
  const job = await Job.findById(jobId);

  if (!job) {
    return { allowed: false, status: 404, message: 'Job not found.' };
  }

  if (String(job.createdBy) !== userId) {
    return { allowed: false, status: 403, message: 'You do not have permission to access this job.' };
  }

  return { allowed: true };
};

const getUserId = (req: Request): string | null => req.user?.userId ?? null;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000;

const GEMINI_RESUME_TEXT_LIMIT = getEnvNumber('GEMINI_RESUME_TEXT_LIMIT', 15000);
const GEMINI_RATE_LIMIT_MAX_RETRIES = getEnvNumber('GEMINI_RATE_LIMIT_MAX_RETRIES', 3);
const GEMINI_RATE_LIMIT_BASE_BACKOFF_MS = getEnvNumber('GEMINI_RATE_LIMIT_BASE_BACKOFF_MS', 15000);
const GEMINI_RATE_LIMIT_MIN_BACKOFF_MS = getEnvNumber('GEMINI_RATE_LIMIT_MIN_BACKOFF_MS', 5000);
const BULK_UPLOAD_THROTTLE_THRESHOLD = getEnvNumber('BULK_UPLOAD_THROTTLE_THRESHOLD', 5);
const BULK_UPLOAD_THROTTLE_DELAY_MS = getEnvNumber('BULK_UPLOAD_THROTTLE_DELAY_MS', 4000);

export const addUmuravaApplicant = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { jobId } = req.body as { jobId?: string };

  if (!jobId) {
    res.status(400).json({ message: 'jobId is required.' });
    return;
  }

  try {
    const ownership = await checkJobOwnership(jobId, userId);

    if (!ownership.allowed) {
      res.status(ownership.status).json({ message: ownership.message });
      return;
    }

    const applicant = await Applicant.create({
      ...req.body,
      jobId,
      source: 'Umurava',
    });

    res.status(201).json(applicant);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: 'Applicant already exists for this job' });
      return;
    }

    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Add Umurava applicant error:', error.message);
    }

    res.status(500).json({ message: 'Failed to add applicant.' });
  }
};

export const addExternalApplicant = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { jobId, resumeUrl } = req.body as { jobId?: string; resumeUrl?: string };

  if (!jobId) {
    res.status(400).json({ message: 'jobId is required.' });
    return;
  }

  try {
    const ownership = await checkJobOwnership(jobId, userId);

    if (!ownership.allowed) {
      res.status(ownership.status).json({ message: ownership.message });
      return;
    }

    const bodyFields = req.body as Record<string, unknown> & { profileData?: unknown };
    const fallbackApplicantData = buildFallbackApplicantData(jobId);
    const incomingProfileData = parseProfileData(bodyFields.profileData);
    const baseApplicantData = {
      ...fallbackApplicantData,
      ...bodyFields,
      jobId,
      source: 'External' as const,
      status: 'pending' as const,
      profileData: {
        ...incomingProfileData,
        rawResumeText: '',
      },
      ...(resumeUrl ? { resumeUrl } : {}),
    };

    let rawResumeText = '';
    let extractedFromGemini: Partial<ExtractedApplicantPayload> = {};

    const resumeBuffer = req.file?.buffer
      ? req.file.buffer
      : resumeUrl
        ? await (async () => {
            try {
              const fetchedResume = await axios.get<ArrayBuffer>(resumeUrl, { responseType: 'arraybuffer' });
              return Buffer.from(fetchedResume.data);
            } catch (fetchError) {
              console.error('Failed to fetch resume from URL:', fetchError);
              return null;
            }
          })()
        : null;

    if (resumeBuffer) {
      try {
        const parser = new PDFParse({ data: resumeBuffer });
        const parsedPdf = await parser.getText();
        rawResumeText = parsedPdf.text ?? '';
        await parser.destroy();
      } catch (pdfError) {
        console.error('Failed to parse resume PDF:', pdfError);
      }
    }

    if (rawResumeText) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
          console.error('GEMINI_API_KEY is not configured. Skipping Gemini extraction.');
        } else {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite-preview',
            generationConfig: { responseMimeType: 'application/json' },
          });

          const prompt =
            'Extract structured data from this resume and return ONLY valid JSON with these exact fields — no markdown, no explanation, just the JSON object:\n' +
            '{\n' +
            'firstName: string,\n' +
            'lastName: string,\n' +
            'email: string,\n' +
            'phone: string,\n' +
            'currentRole: string,\n' +
            'yearsOfExperience: number,\n' +
            'educationLevel: one of [High School, Associate, Bachelor, Master, PhD, Other],\n' +
            'skills: string[]\n' +
            '}\n' +
            'If a field cannot be found, use an empty string or 0.\n' +
            `Resume text: ${rawResumeText.slice(0, GEMINI_RESUME_TEXT_LIMIT)}`;

          const aiResponse = await model.generateContent(prompt);
          const responseText = aiResponse.response.text();
          const parsedResponse = JSON.parse(sanitizeJson(responseText)) as ExtractedApplicantPayload;

          extractedFromGemini = {
            firstName: normalizeString(parsedResponse.firstName),
            lastName: normalizeString(parsedResponse.lastName),
            email: normalizeString(parsedResponse.email),
            phone: normalizeString(parsedResponse.phone),
            skills: normalizeSkills(parsedResponse.skills),
            yearsOfExperience: normalizeYearsOfExperience(parsedResponse.yearsOfExperience),
            educationLevel: normalizeString(parsedResponse.educationLevel),
            currentRole: normalizeString(parsedResponse.currentRole),
          };
        }
      } catch (geminiError) {
        console.error('Failed to extract resume data with Gemini:', geminiError);
      }
    }

    const applicant = await Applicant.create({
      ...baseApplicantData,
      firstName: normalizeString(extractedFromGemini.firstName, normalizeString(bodyFields.firstName, fallbackApplicantData.firstName)),
      lastName: normalizeString(extractedFromGemini.lastName, normalizeString(bodyFields.lastName, fallbackApplicantData.lastName)),
      email: normalizeString(extractedFromGemini.email, normalizeString(bodyFields.email, fallbackApplicantData.email)),
      phone: normalizeString(extractedFromGemini.phone, normalizeString(bodyFields.phone, '')),
      skills:
        normalizeSkills(extractedFromGemini.skills).length > 0
          ? normalizeSkills(extractedFromGemini.skills)
          : normalizeSkills(bodyFields.skills),
      yearsOfExperience:
        typeof extractedFromGemini.yearsOfExperience === 'number' && extractedFromGemini.yearsOfExperience > 0
          ? extractedFromGemini.yearsOfExperience
          : coerceYearsOfExperience(bodyFields.yearsOfExperience),
      educationLevel: normalizeString(
        extractedFromGemini.educationLevel,
        normalizeString(bodyFields.educationLevel, fallbackApplicantData.educationLevel),
      ),
      currentRole: normalizeString(extractedFromGemini.currentRole, normalizeString(bodyFields.currentRole, '')),
      profileData: {
        ...incomingProfileData,
        rawResumeText,
      },
    });

    res.status(201).json(applicant);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: 'Applicant already exists for this job' });
      return;
    }

    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Add external applicant error:', error.message);
    }

    res.status(500).json({ message: 'Failed to add applicant.' });
  }
};

export const getApplicantsForJob = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { jobId } = req.params as { jobId?: string };

  if (!jobId) {
    res.status(400).json({ message: 'jobId is required.' });
    return;
  }

  try {
    const ownership = await checkJobOwnership(jobId, userId);

    if (!ownership.allowed) {
      res.status(ownership.status).json({ message: ownership.message });
      return;
    }

    const applicants = await Applicant.find({ jobId }).sort({ createdAt: -1 });
    res.status(200).json(applicants);
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Get applicants for job error:', error.message);
    }

    res.status(500).json({ message: 'Failed to fetch applicants.' });
  }
};

export const getApplicantById = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  const { id } = req.params as { id?: string };

  if (!id) {
    res.status(400).json({ message: 'Applicant id is required.' });
    return;
  }

  try {
    const applicant = await Applicant.findById(id).populate('jobId');

    if (!applicant) {
      res.status(404).json({ message: 'Applicant not found.' });
      return;
    }

    const populatedJob = applicant.jobId as { createdBy?: unknown } | null;

    if (!populatedJob || !populatedJob.createdBy) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (String(populatedJob.createdBy) !== userId) {
      res.status(403).json({ message: 'You do not have permission to view this applicant.' });
      return;
    }

    res.status(200).json(applicant);
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Applicant not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Get applicant by id error:', error.message);
    }

    res.status(500).json({ message: 'Failed to fetch applicant.' });
  }
};

const extractRetryAfterSeconds = (error: unknown): number | null => {
  if (error instanceof Error) {
    const match = error.message.match(/Please retry in ([\d.]+)s/);
    if (match && match[1]) {
      const seconds = parseFloat(match[1]);
      // Return milliseconds with a minimum of 2 seconds
      return Math.max(2000, Math.ceil(seconds * 1000) + 2000);
    }
  }
  return null;
};

const isRateLimitError = (error: unknown): boolean =>
  error instanceof Error && (error.message.includes('429') || error.message.includes('Too Many Requests'));

export const bulkUploadAndExtract = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  try {
    const { jobId } = req.body as { jobId?: string };
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (!jobId || files.length === 0) {
      res.status(400).json({ message: 'jobId and at least one resume file are required.' });
      return;
    }

    const ownership = await checkJobOwnership(jobId, userId);

    if (!ownership.allowed) {
      res.status(ownership.status).json({ message: ownership.message });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: 'GEMINI_API_KEY is not configured.' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite-preview',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const results: unknown[] = [];
    const errors: { fileName: string; error: string; retryAfter?: number }[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      let processed = false;
      let retryCount = 0;

      while (!processed && retryCount < GEMINI_RATE_LIMIT_MAX_RETRIES) {
        try {
          const parser = new PDFParse({ data: file.buffer });
          const parsedPdf = await parser.getText();
          const pdfText = parsedPdf.text ?? '';
          await parser.destroy();

          const prompt = `You are an HR Data Extractor. Extract applicant data from this resume text and return ONLY a valid raw JSON object with exactly these keys:
{
  "firstName": "string (default 'Unknown')",
  "lastName": "string (default 'Candidate')",
  "email": "string (default 'fake email')",
  "skills": ["string"],
  "yearsOfExperience": number,
  "educationLevel": "string",
  "currentRole": "string"
}
Resume text:
${pdfText.slice(0, GEMINI_RESUME_TEXT_LIMIT)}`;

          const aiResponse = await model.generateContent(prompt);
          const responseText = aiResponse.response.text();
          const parsed = JSON.parse(sanitizeJson(responseText)) as ExtractedApplicantPayload;

          const applicant = await Applicant.create({
            jobId,
            source: 'External',
            status: 'pending',
            firstName: (parsed.firstName ?? 'Unknown').trim() || 'Unknown',
            lastName: (parsed.lastName ?? 'Candidate').trim() || 'Candidate',
            email: (parsed.email ?? `fake-email-${Date.now()}-${i}@example.com`).trim() || `fake-email-${Date.now()}-${i}@example.com`,
            skills: Array.isArray(parsed.skills) ? parsed.skills.filter((skill) => typeof skill === 'string') : [],
            yearsOfExperience: typeof parsed.yearsOfExperience === 'number' ? parsed.yearsOfExperience : 0,
            educationLevel: (parsed.educationLevel ?? 'Not specified').trim() || 'Not specified',
            currentRole: (parsed.currentRole ?? '').trim() || undefined,
            profileData: { rawResumeText: pdfText },
          });

          results.push(applicant);
          processed = true;
        } catch (error) {
          if (isRateLimitError(error)) {
            const apiRetryAfterMs = extractRetryAfterSeconds(error);
            const exponentialBackoffMs = Math.pow(2, retryCount) * GEMINI_RATE_LIMIT_BASE_BACKOFF_MS;
            const backoffDelay = Math.max(apiRetryAfterMs ?? exponentialBackoffMs, GEMINI_RATE_LIMIT_MIN_BACKOFF_MS);
            retryCount += 1;

            if (retryCount >= GEMINI_RATE_LIMIT_MAX_RETRIES) {
              errors.push({
                fileName: file.originalname,
                error: error instanceof Error ? error.message : 'Rate limit exceeded after retries.',
                retryAfter: apiRetryAfterMs ?? undefined,
              });
              processed = true;
            } else {
              const delaySeconds = (backoffDelay / 1000).toFixed(1);
              console.warn(
                `Rate limit hit for ${file.originalname}. Retrying in ${delaySeconds}s (attempt ${retryCount}/${GEMINI_RATE_LIMIT_MAX_RETRIES})`,
              );
              await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            }
          } else {
            errors.push({
              fileName: file.originalname,
              error: error instanceof Error ? error.message : 'Failed to process file.',
            });
            processed = true;
          }
        }
      }

      if (files.length > BULK_UPLOAD_THROTTLE_THRESHOLD && i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, BULK_UPLOAD_THROTTLE_DELAY_MS));
      }
    }

    res.status(200).json({
      message: 'Bulk upload and extraction completed.',
      successfulUploads: results.length,
      failedUploads: errors.length,
      results,
      errors,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Bulk upload and extract error:', error.message);
    }

    res.status(500).json({ message: 'Failed to bulk upload and extract applicants.' });
  }
};

