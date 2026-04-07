import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import {
  addExternalApplicant,
  addUmuravaApplicant,
  bulkUploadAndExtract,
  getApplicantById,
  getApplicantsForJob,
} from '../controllers/applicantController';

const router = Router();

router.use(protect);

router.post('/umurava', addUmuravaApplicant);
router.post('/external', upload.single('resume'), addExternalApplicant);
router.post('/bulk-upload', upload.array('resumes'), bulkUploadAndExtract);
router.get('/job/:jobId', getApplicantsForJob);
router.get('/:id', getApplicantById);

export default router;

