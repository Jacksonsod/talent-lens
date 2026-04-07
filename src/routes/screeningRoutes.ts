import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getJobShortlist, getScreeningDetail, screenAllApplicants, screenApplicant } from '../controllers/screeningController';

const router = Router();

router.use(protect);

router.post('/job/:jobId/applicant/:applicantId/screen', screenApplicant);
router.get('/job/:jobId/shortlist', getJobShortlist);
router.post('/job/:jobId/screen-all', screenAllApplicants);
router.get('/:id', getScreeningDetail);

export default router;

