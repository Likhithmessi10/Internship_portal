const prisma = require('../lib/prisma');

/**
 * Create a new internship with validation
 */
const createInternship = async (data) => {
    // Business logic validation can go here
    return await prisma.internship.create({
        data: {
            ...data,
            openingsCount: parseInt(data.openingsCount),
            applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
            stipendAmount: data.stipendAmount ? parseFloat(data.stipendAmount) : null,
            shortlistingRatio: data.shortlistingRatio ? parseInt(data.shortlistingRatio) : 2,
        }
    });
};

/**
 * Toggle internship status
 */
const toggleInternship = async (id) => {
    const internship = await prisma.internship.findUnique({ where: { id } });
    if (!internship) throw new Error('Internship not found');
    
    return await prisma.internship.update({
        where: { id },
        data: { isActive: !internship.isActive }
    });
};

module.exports = {
    createInternship,
    toggleInternship
};
