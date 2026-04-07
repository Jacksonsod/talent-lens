import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import {
  addExternalApplicant,
  addUmuravaApplicant,
  getApplicantById,
  getApplicantsForJob,
} from '../controllers/applicantController';

const router = Router();

router.use(protect);

router.post('/umurava', addUmuravaApplicant);
router.post('/external', upload.single('resume'), addExternalApplicant);
router.get('/job/:jobId', getApplicantsForJob);
router.get('/:id', getApplicantById);

export default router;

