import type { Request, Response } from 'express';
import Job, { type JobStatus } from '../models/Job';

const allowedStatuses: JobStatus[] = ['Draft', 'Open', 'Screening', 'Closed'];

const getAuthenticatedUserId = (req: Request): string | null => req.user?.userId ?? null;

const isJobStatus = (value: unknown): value is JobStatus =>
  typeof value === 'string' && allowedStatuses.includes(value as JobStatus);

const normalizeStringArray = (value: unknown): string[] | null => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return null;
  }

  return value.map((item) => item.trim()).filter((item) => item.length > 0);
};

const ownsJob = (jobUserId: unknown, userId: string): boolean => String(jobUserId) === userId;

const isValidShortlistSize = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

export const createJob = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  try {
    const { roleTitle, description, requirements, requiredSkills, experienceLevel, shortlistSize, status } = req.body as {
      roleTitle?: string;
      description?: string;
      requirements?: unknown;
      requiredSkills?: unknown;
      experienceLevel?: string;
      shortlistSize?: number;
      status?: JobStatus;
    };

    if (!roleTitle || !description || !experienceLevel) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    if (status !== undefined && !isJobStatus(status)) {
      res.status(400).json({ message: 'Invalid job status.' });
      return;
    }

    const normalizedRequirements = normalizeStringArray(requirements);
    const normalizedSkills = normalizeStringArray(requiredSkills);

    if (normalizedRequirements === null || normalizedSkills === null) {
      res.status(400).json({ message: 'requirements and requiredSkills must be arrays of strings.' });
      return;
    }

    if (shortlistSize !== undefined && !isValidShortlistSize(shortlistSize)) {
      res.status(400).json({ message: 'shortlistSize must be a positive integer.' });
      return;
    }

    const job = await Job.create({
      createdBy: userId,
      roleTitle: roleTitle.trim(),
      description: description.trim(),
      requirements: normalizedRequirements,
      requiredSkills: normalizedSkills,
      experienceLevel: experienceLevel.trim(),
      shortlistSize: shortlistSize ?? 10,
      ...(status ? { status } : {}),
    });

    res.status(201).json(job);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Create job error:', error.message);
    }

    res.status(500).json({ message: 'Failed to create job.' });
  }
};

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  try {
    const jobs = await Job.find({ createdBy: userId }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Get jobs error:', error.message);
    }

    res.status(500).json({ message: 'Failed to fetch jobs.' });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (!ownsJob(job.createdBy, userId)) {
      res.status(403).json({ message: 'You do not have permission to view this job.' });
      return;
    }

    res.status(200).json(job);
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Get job by id error:', error.message);
    }

    res.status(500).json({ message: 'Failed to fetch job.' });
  }
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (!ownsJob(job.createdBy, userId)) {
      res.status(403).json({ message: 'You do not have permission to update this job.' });
      return;
    }

    const { roleTitle, description, requirements, requiredSkills, experienceLevel, shortlistSize } = req.body as {
      roleTitle?: string;
      description?: string;
      requirements?: unknown;
      requiredSkills?: unknown;
      experienceLevel?: string;
      shortlistSize?: number;
    };

    if (requirements !== undefined) {
      const normalizedRequirements = normalizeStringArray(requirements);
      if (normalizedRequirements === null) {
        res.status(400).json({ message: 'requirements must be an array of strings.' });
        return;
      }
      job.requirements = normalizedRequirements;
    }

    if (requiredSkills !== undefined) {
      const normalizedSkills = normalizeStringArray(requiredSkills);
      if (normalizedSkills === null) {
        res.status(400).json({ message: 'requiredSkills must be an array of strings.' });
        return;
      }
      job.requiredSkills = normalizedSkills;
    }

    if (shortlistSize !== undefined) {
      if (!isValidShortlistSize(shortlistSize)) {
        res.status(400).json({ message: 'shortlistSize must be a positive integer.' });
        return;
      }
      job.shortlistSize = shortlistSize;
    }

    if (roleTitle !== undefined) {
      job.roleTitle = roleTitle.trim();
    }

    if (description !== undefined) {
      job.description = description.trim();
    }

    if (experienceLevel !== undefined) {
      job.experienceLevel = experienceLevel.trim();
    }

    await job.save();
    res.status(200).json(job);
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Update job error:', error.message);
    }

    res.status(500).json({ message: 'Failed to update job.' });
  }
};

export const updateJobStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  try {
    const { status } = req.body as { status?: unknown };

    if (!isJobStatus(status)) {
      res.status(400).json({ message: 'Invalid job status.' });
      return;
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (!ownsJob(job.createdBy, userId)) {
      res.status(403).json({ message: 'You do not have permission to update this job.' });
      return;
    }

    job.status = status;
    await job.save();

    res.status(200).json(job);
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Update job status error:', error.message);
    }

    res.status(500).json({ message: 'Failed to update job status.' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (!ownsJob(job.createdBy, userId)) {
      res.status(403).json({ message: 'You do not have permission to delete this job.' });
      return;
    }

    await job.deleteOne();
    res.status(200).json({ message: 'Job deleted successfully.' });
  } catch (error) {
    if (error instanceof Error && error.name === 'CastError') {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (error instanceof Error) {
      console.error('Delete job error:', error.message);
    }

    res.status(500).json({ message: 'Failed to delete job.' });
  }
};

