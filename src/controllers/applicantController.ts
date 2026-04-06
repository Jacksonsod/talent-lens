import type { Request, Response } from 'express';
import { PDFParse } from 'pdf-parse';
import Applicant from '../models/Applicant';
import Job from '../models/Job';

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

    let extractedText = '';
    if (req.file?.buffer) {
      const parser = new PDFParse({ data: req.file.buffer });
      const parsedPdf = await parser.getText();
      extractedText = parsedPdf.text;
      await parser.destroy();
    }

    const incomingProfileData = (req.body as { profileData?: unknown }).profileData;
    const profileData =
      incomingProfileData && typeof incomingProfileData === 'object'
        ? { ...(incomingProfileData as Record<string, unknown>), rawResumeText: extractedText }
        : { rawResumeText: extractedText };

    const applicant = await Applicant.create({
      ...req.body,
      jobId,
      source: 'External',
      profileData,
      ...(resumeUrl ? { resumeUrl } : {}),
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

