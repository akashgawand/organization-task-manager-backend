/**
 * Calculate pagination parameters
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} - { skip, take }
 */
const getPaginationParams = (page = 1, limit = 10) => {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const validPage = pageNum > 0 ? pageNum : 1;
    const validLimit = limitNum > 0 && limitNum <= 100 ? limitNum : 10;

    return {
        skip: (validPage - 1) * validLimit,
        take: validLimit,
    };
};

/**
 * Generate pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
const getPaginationMeta = (total, page = 1, limit = 10) => {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const totalPages = Math.ceil(total / limitNum);

    return {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
    };
};

/**
 * Create paginated response
 * @param {Array} data - Data items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Paginated response
 */
const createPaginatedResponse = (data, total, page, limit) => {
    return {
        data,
        pagination: getPaginationMeta(total, page, limit),
    };
};

module.exports = {
    getPaginationParams,
    getPaginationMeta,
    createPaginatedResponse,
};
