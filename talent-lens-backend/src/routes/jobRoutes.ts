import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { createJob, getJobById, getJobs, updateJob, updateJobStatus } from '../controllers/jobController';

const router = Router();

router.use(protect);

router.post('/', createJob);
router.get('/', getJobs);
router.get('/:id', getJobById);
router.put('/:id', updateJob);
router.patch('/:id/status', updateJobStatus);

export default router;

