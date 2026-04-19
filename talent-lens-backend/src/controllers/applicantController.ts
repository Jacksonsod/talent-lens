import axios from 'axios';
import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Applicant, {
  type ApplicantAvailability,
  type ApplicantCertification,
  type ApplicantEducation,
  type ApplicantExperience,
  type ApplicantLanguage,
  type ApplicantProject,
  type ApplicantSkill,
  type ApplicantSocialLinks,
  type ApplicantSource,
} from '../models/Applicant';
import Job from '../models/Job';

type ExtractedApplicantPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  headline?: string;
  bio?: string;
  location?: string;
  isResumeIncomplete?: unknown;
  skills?: Array<{ name?: unknown; level?: unknown; yearsOfExperience?: unknown } | string>;
  languages?: Array<{ name?: unknown; proficiency?: unknown } | string>;
  experience?: Array<{
    company?: unknown;
    role?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    description?: unknown;
    technologies?: unknown;
    isCurrent?: unknown;
  }>;
  education?: Array<{
    institution?: unknown;
    degree?: unknown;
    fieldOfStudy?: unknown;
    startYear?: unknown;
    endYear?: unknown;
  }>;
  certifications?: Array<{ name?: unknown; issuer?: unknown; issueDate?: unknown }>;
  projects?: Array<{
    name?: unknown;
    description?: unknown;
    technologies?: unknown;
    role?: unknown;
    link?: unknown;
    startDate?: unknown;
    endDate?: unknown;
  }>;
  socialLinks?: {
    linkedin?: unknown;
    github?: unknown;
    portfolio?: unknown;
  };
  availability?: {
    status?: unknown;
    type?: unknown;
    startDate?: unknown;
  };
  yearsOfExperience?: unknown;
  educationLevel?: unknown;
  currentRole?: unknown;
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

const normalizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const normalizeBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return fallback;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => normalizeString(item)).filter((item) => item.length > 0);
};

const hasMeaningfulObjectValues = (value: object): boolean =>
  Object.values(value as Record<string, unknown>).some((entry) => {
    if (Array.isArray(entry)) {
      return entry.length > 0;
    }

    if (typeof entry === 'string') {
      return entry.trim().length > 0;
    }

    if (typeof entry === 'number') {
      return Number.isFinite(entry);
    }

    if (typeof entry === 'boolean') {
      return entry;
    }

    return Boolean(entry);
  });

const buildSafeEmail = (jobId: string, indexHint?: number): string => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${typeof indexHint === 'number' ? `-${indexHint}` : ''}`;
  return `fake-email-${jobId}-${uniqueSuffix}@example.com`;
};

const buildFallbackApplicantData = (jobId: string, indexHint?: number) => ({
  firstName: 'Unknown',
  lastName: 'Candidate',
  email: buildSafeEmail(jobId, indexHint),
  phone: '',
  headline: '',
  bio: '',
  location: '',
  skills: [] as ApplicantSkill[],
  languages: [] as ApplicantLanguage[],
  experience: [] as ApplicantExperience[],
  education: [] as ApplicantEducation[],
  certifications: [] as ApplicantCertification[],
  projects: [] as ApplicantProject[],
  availability: {
    status: '',
    type: '',
    startDate: '',
  } as ApplicantAvailability,
  socialLinks: {
    linkedin: '',
    github: '',
    portfolio: '',
  } as ApplicantSocialLinks,
  yearsOfExperience: 0,
  educationLevel: 'Other',
  currentRole: '',
});

const normalizeSkills = (value: unknown): ApplicantSkill[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    if (typeof item === 'string') {
      return { name: normalizeString(item), level: '', yearsOfExperience: 0 };
    }

    if (!item || typeof item !== 'object') {
      return { name: '', level: '', yearsOfExperience: 0 };
    }

    const entry = item as { name?: unknown; level?: unknown; yearsOfExperience?: unknown };
    return {
      name: normalizeString(entry.name),
      level: normalizeString(entry.level),
      yearsOfExperience: normalizeNumber(entry.yearsOfExperience),
    };
  });
};

const normalizeLanguages = (value: unknown): ApplicantLanguage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    if (typeof item === 'string') {
      return { name: normalizeString(item), proficiency: '' };
    }

    if (!item || typeof item !== 'object') {
      return { name: '', proficiency: '' };
    }

    const entry = item as { name?: unknown; proficiency?: unknown };
    return {
      name: normalizeString(entry.name),
      proficiency: normalizeString(entry.proficiency),
    };
  });
};

const normalizeExperience = (value: unknown): ApplicantExperience[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      return {
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        description: '',
        technologies: [],
        isCurrent: false,
      };
    }

    const entry = item as {
      company?: unknown;
      role?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      description?: unknown;
      technologies?: unknown;
      isCurrent?: unknown;
    };

    return {
      company: normalizeString(entry.company),
      role: normalizeString(entry.role),
      startDate: normalizeString(entry.startDate),
      endDate: normalizeString(entry.endDate),
      description: normalizeString(entry.description),
      technologies: normalizeStringArray(entry.technologies),
      isCurrent: normalizeBoolean(entry.isCurrent),
    };
  });
};

const normalizeEducation = (value: unknown): ApplicantEducation[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      return {
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startYear: 0,
        endYear: 0,
      };
    }

    const entry = item as { institution?: unknown; degree?: unknown; fieldOfStudy?: unknown; startYear?: unknown; endYear?: unknown };
    return {
      institution: normalizeString(entry.institution),
      degree: normalizeString(entry.degree),
      fieldOfStudy: normalizeString(entry.fieldOfStudy),
      startYear: normalizeNumber(entry.startYear),
      endYear: normalizeNumber(entry.endYear),
    };
  });
};

const normalizeCertifications = (value: unknown): ApplicantCertification[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      return { name: '', issuer: '', issueDate: '' };
    }

    const entry = item as { name?: unknown; issuer?: unknown; issueDate?: unknown };
    return {
      name: normalizeString(entry.name),
      issuer: normalizeString(entry.issuer),
      issueDate: normalizeString(entry.issueDate),
    };
  });
};

const normalizeProjects = (value: unknown): ApplicantProject[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      return {
        name: '',
        description: '',
        technologies: [],
        role: '',
        link: '',
        startDate: '',
        endDate: '',
      };
    }

    const entry = item as {
      name?: unknown;
      description?: unknown;
      technologies?: unknown;
      role?: unknown;
      link?: unknown;
      startDate?: unknown;
      endDate?: unknown;
    };

    return {
      name: normalizeString(entry.name),
      description: normalizeString(entry.description),
      technologies: normalizeStringArray(entry.technologies),
      role: normalizeString(entry.role),
      link: normalizeString(entry.link),
      startDate: normalizeString(entry.startDate),
      endDate: normalizeString(entry.endDate),
    };
  });
};

const normalizeAvailability = (value: unknown): ApplicantAvailability => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      status: '',
      type: '',
      startDate: '',
    };
  }

  const entry = value as { status?: unknown; type?: unknown; startDate?: unknown };
  return {
    status: normalizeString(entry.status),
    type: normalizeString(entry.type),
    startDate: normalizeString(entry.startDate),
  };
};

const normalizeSocialLinks = (value: unknown): ApplicantSocialLinks => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      linkedin: '',
      github: '',
      portfolio: '',
    };
  }

  const entry = value as { linkedin?: unknown; github?: unknown; portfolio?: unknown };
  return {
    linkedin: normalizeString(entry.linkedin),
    github: normalizeString(entry.github),
    portfolio: normalizeString(entry.portfolio),
  };
};

const buildApplicantExtractionPrompt = (): string =>
  `You are an HR Data Extractor. Extract structured data from this resume PDF and return ONLY valid JSON with these exact fields — no markdown, no explanation, just the JSON object:
{
  "firstName": "string (default 'Unknown')",
  "lastName": "string (default 'Candidate')",
  "email": "string (default 'fake email')",
  "phone": "string",
  "headline": "string (Short professional summary)",
  "bio": "string (Detailed biography)",
  "location": "string (City, Country)",
  "isResumeIncomplete": boolean,
  "skills": [ { "name": "string", "level": "Beginner | Intermediate | Advanced | Expert", "yearsOfExperience": number } ],
  "languages": [ { "name": "string", "proficiency": "Basic | Conversational | Fluent | Native" } ],
  "experience": [ { "company": "string", "role": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM | Present", "description": "string", "technologies": ["string"], "isCurrent": boolean } ],
  "education": [ { "institution": "string", "degree": "string", "fieldOfStudy": "string", "startYear": number, "endYear": number } ],
  "certifications": [ { "name": "string", "issuer": "string", "issueDate": "YYYY-MM" } ],
  "projects": [ { "name": "string", "description": "string", "technologies": ["string"], "role": "string", "link": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM" } ],
  "socialLinks": { "linkedin": "string", "github": "string", "portfolio": "string" }
}
If a field is completely missing from the resume, omit it or use empty strings/arrays, but preserve the exact schema structure.
Set 'isResumeIncomplete' to true ONLY IF any of these conditions are met: 1) The document is completely unreadable/corrupt, 2) Missing First Name, Last Name, or Email, 3) The 'experience' array is empty, 4) The 'education' array is empty, or 5) The 'skills' array is empty.`;

const buildGeminiModel = (): ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured. Skipping Gemini extraction.');
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite-preview',
    generationConfig: { responseMimeType: 'application/json' },
  });
};

const extractResume = async (
  buffer: Buffer,
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null,
): Promise<{ extracted: Partial<ExtractedApplicantPayload> }> => {
  if (!model) {
    return { extracted: {} };
  }

  try {
    const prompt = buildApplicantExtractionPrompt();
    const pdfPart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    };

    const aiResponse = await model.generateContent([prompt, pdfPart]);
    const responseText = aiResponse.response.text();
    const parsedResponse = JSON.parse(sanitizeJson(responseText)) as Partial<ExtractedApplicantPayload>;
    return { extracted: parsedResponse };
  } catch (error) {
    console.error('Failed to extract resume data with Gemini PDF handling:', error);
    return { extracted: {} };
  }
};

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

const buildApplicantCreatePayload = ({
  jobId,
  source,
  bodyFields,
  extractedFields,
  profileData,
  rawResumeText,
  indexHint,
  resumeUrl,
  resumeFetchError,
}: {
  jobId: string;
  source: ApplicantSource;
  bodyFields: Record<string, unknown>;
  extractedFields?: Partial<ExtractedApplicantPayload>;
  profileData?: Record<string, unknown>;
  rawResumeText: string;
  indexHint?: number;
  resumeUrl?: string;
  resumeFetchError?: string;
}): Record<string, unknown> => {
  const fallback = buildFallbackApplicantData(jobId, indexHint);

  const resolveStringField = (extractedValue: unknown, bodyValue: unknown, fallbackValue: string): string => {
    const extracted = normalizeString(extractedValue);
    if (extracted.length > 0) return extracted;
    const body = normalizeString(bodyValue);
    return body.length > 0 ? body : fallbackValue;
  };

  const resolveNumberField = (extractedValue: unknown, bodyValue: unknown, fallbackValue: number): number => {
    const extracted = normalizeNumber(extractedValue, 0);
    if (extracted > 0) return extracted;
    const body = normalizeNumber(bodyValue, 0);
    return body > 0 ? body : fallbackValue;
  };

  const resolveArrayField = <T>(
    extractedValue: unknown,
    bodyValue: unknown,
    normalizer: (value: unknown) => T[],
    fallbackValue: T[],
  ): T[] => {
    const extracted = normalizer(extractedValue);
    if (extracted.length > 0) return extracted;
    const body = normalizer(bodyValue);
    return body.length > 0 ? body : fallbackValue;
  };

  const resolveObjectField = <T extends object>(
    extractedValue: unknown,
    bodyValue: unknown,
    normalizer: (value: unknown) => T,
    fallbackValue: T,
  ): T => {
    const extracted = normalizer(extractedValue);
    if (hasMeaningfulObjectValues(extracted)) return extracted;
    const body = normalizer(bodyValue);
    return hasMeaningfulObjectValues(body) ? body : fallbackValue;
  };

  return {
    jobId,
    source,
    status: 'pending' as const,
    firstName: resolveStringField(extractedFields?.firstName, bodyFields.firstName, fallback.firstName),
    lastName: resolveStringField(extractedFields?.lastName, bodyFields.lastName, fallback.lastName),
    email: resolveStringField(extractedFields?.email, bodyFields.email, fallback.email),
    phone: resolveStringField(extractedFields?.phone, bodyFields.phone, fallback.phone),
    headline: resolveStringField(extractedFields?.headline, bodyFields.headline, fallback.headline),
    bio: resolveStringField(extractedFields?.bio, bodyFields.bio, fallback.bio),
    location: resolveStringField(extractedFields?.location, bodyFields.location, fallback.location),
    skills: resolveArrayField(extractedFields?.skills, bodyFields.skills, normalizeSkills, fallback.skills),
    languages: resolveArrayField(extractedFields?.languages, bodyFields.languages, normalizeLanguages, fallback.languages),
    experience: resolveArrayField(extractedFields?.experience, bodyFields.experience, normalizeExperience, fallback.experience),
    education: resolveArrayField(extractedFields?.education, bodyFields.education, normalizeEducation, fallback.education),
    certifications: resolveArrayField(
      extractedFields?.certifications,
      bodyFields.certifications,
      normalizeCertifications,
      fallback.certifications,
    ),
    projects: resolveArrayField(extractedFields?.projects, bodyFields.projects, normalizeProjects, fallback.projects),
    availability: resolveObjectField(extractedFields?.availability, bodyFields.availability, normalizeAvailability, fallback.availability),
    socialLinks: resolveObjectField(extractedFields?.socialLinks, bodyFields.socialLinks, normalizeSocialLinks, fallback.socialLinks),
    yearsOfExperience: resolveNumberField(extractedFields?.yearsOfExperience, bodyFields.yearsOfExperience, fallback.yearsOfExperience),
    educationLevel: resolveStringField(extractedFields?.educationLevel, bodyFields.educationLevel, fallback.educationLevel),
    currentRole: resolveStringField(extractedFields?.currentRole, bodyFields.currentRole, fallback.currentRole),
    resumeFetchError: normalizeString(resumeFetchError),
    isResumeIncomplete: Boolean(normalizeString(resumeFetchError))
      ? true
      : normalizeBoolean(extractedFields?.isResumeIncomplete, false),
    profileData: {
      ...(profileData ?? {}),
      rawResumeText,
    },
    ...(resumeUrl ? { resumeUrl } : {}),
  };
};

const createApplicantFromBody = (
  jobId: string,
  source: ApplicantSource,
  bodyFields: Record<string, unknown> & { profileData?: unknown },
  extractedFields: Partial<ExtractedApplicantPayload> = {},
  rawResumeText = '',
  indexHint?: number,
  resumeUrl?: string,
) =>
  buildApplicantCreatePayload({
    jobId,
    source,
    bodyFields,
    extractedFields,
    profileData: parseProfileData(bodyFields.profileData),
    rawResumeText,
    indexHint,
    resumeUrl,
  });

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

    const bodyFields = req.body as Record<string, unknown> & { profileData?: unknown };
    const applicant = await Applicant.create(createApplicantFromBody(jobId, 'Umurava', bodyFields));
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
    const incomingProfileData = parseProfileData(bodyFields.profileData);

    let rawResumeText = '';
    let extracted: Partial<ExtractedApplicantPayload> = {};
    let resumeFetchError = '';

    const resumeBuffer = req.file?.buffer
      ? req.file.buffer
      : resumeUrl
        ? await (async () => {
            try {
              const fetchedResume = await axios.get<ArrayBuffer>(resumeUrl, { responseType: 'arraybuffer' });
              return Buffer.from(fetchedResume.data);
            } catch (fetchError) {
              const message =
                axios.isAxiosError(fetchError)
                  ? fetchError.response
                    ? `${fetchError.response.status} ${fetchError.response.statusText}`.trim()
                    : fetchError.code ?? fetchError.message
                  : fetchError instanceof Error
                    ? fetchError.message
                    : String(fetchError);
              resumeFetchError = message;
              console.error('Failed to fetch resume from URL:', message);
              return null;
            }
          })()
        : null;

    if (resumeBuffer) {
      const model = buildGeminiModel();
      const extractedResult = await extractResume(resumeBuffer, model);
      extracted = extractedResult.extracted;

      // Keep some searchable/debuggable text for downstream screening prompts.
      rawResumeText = `Resume extracted via Gemini PDF parsing.\n\n${sanitizeJson(JSON.stringify(extracted ?? {})).slice(0, 15000)}`;
    }

    const applicant = await Applicant.create(
      buildApplicantCreatePayload({
        jobId,
        source: 'External',
        bodyFields,
        extractedFields: extracted,
        profileData: incomingProfileData,
        rawResumeText,
        resumeUrl,
        resumeFetchError,
      }),
    );

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

    const bodyFields = req.body as Record<string, unknown> & { profileData?: unknown };
    const incomingProfileData = parseProfileData(bodyFields.profileData);
    const model = buildGeminiModel();

    const results: unknown[] = [];
    const errors: { fileName: string; error: string }[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];

      try {
        const { extracted } = await extractResume(file.buffer, model);
        const rawResumeText = `Resume extracted via Gemini PDF parsing.\n\n${sanitizeJson(JSON.stringify(extracted ?? {})).slice(0, 15000)}`;
        const applicant = await Applicant.create(
          buildApplicantCreatePayload({
            jobId,
            source: 'External',
            bodyFields,
            extractedFields: extracted,
            profileData: incomingProfileData,
            rawResumeText,
            indexHint: i,
          }),
        );

        results.push(applicant);
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error instanceof Error ? error.message : 'Failed to process file.',
        });
      }

      if (files.length > 5 && i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
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

