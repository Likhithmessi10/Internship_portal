const prisma = require('../lib/prisma');

/**
 * @desc    Submit or update a committee evaluation score for an application
 * @route   POST /api/v1/admin/applications/:id/evaluate
 * @access  Private (ADMIN, CE_PRTI, HOD, COMMITTEE_MEMBER, MENTOR)
 */
const submitEvaluation = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const memberId = req.user.id;
        const role = req.user.role;
        let { score, comments } = req.body;

        // Validation
        if (score === undefined || score === null) {
            return res.status(400).json({ success: false, message: 'Score is required' });
        }

        score = parseFloat(score);

        if (isNaN(score) || score < 0 || score > 10) {
            return res.status(400).json({ success: false, message: 'Score must be a number between 0 and 10' });
        }

        // Verify application exists
        const application = await prisma.application.findUnique({
            where: { id: applicationId }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Upsert the evaluation
        const evaluation = await prisma.committeeEvaluation.upsert({
            where: {
                applicationId_memberId: {
                    applicationId: applicationId,
                    memberId: memberId
                }
            },
            update: {
                score,
                comments: comments || null,
                role
            },
            create: {
                applicationId,
                memberId,
                role,
                score,
                comments: comments || null
            }
        });

        // Calculate and update the average score on the Application model
        const allEvaluations = await prisma.committeeEvaluation.findMany({
            where: { applicationId }
        });

        if (allEvaluations.length > 0) {
            const totalScore = allEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
            const averageScore = totalScore / allEvaluations.length;

            await prisma.application.update({
                where: { id: applicationId },
                data: { committeeFinalScore: averageScore }
            });
        }

        res.status(200).json({
            success: true,
            data: evaluation,
            message: 'Evaluation submitted successfully'
        });

    } catch (error) {
        console.error('Submit evaluation error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    submitEvaluation
};
