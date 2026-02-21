/**
 * Check if a date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
const isPastDate = (date) => {
    return new Date(date) < new Date();
};

/**
 * Check if a date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
const isFutureDate = (date) => {
    return new Date(date) > new Date();
};

/**
 * Add days to a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date}
 */
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * Format date to ISO string
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
const formatDate = (date) => {
    return new Date(date).toISOString();
};

/**
 * Check if deadline is approaching (within specified days)
 * @param {Date|string} deadline - Deadline date
 * @param {number} days - Number of days threshold
 * @returns {boolean}
 */
const isDeadlineApproaching = (deadline, days = 3) => {
    const deadlineDate = new Date(deadline);
    const thresholdDate = addDays(new Date(), days);
    return deadlineDate <= thresholdDate && deadlineDate > new Date();
};

/**
 * Check if deadline is overdue
 * @param {Date|string} deadline - Deadline date
 * @returns {boolean}
 */
const isOverdue = (deadline) => {
    return isPastDate(deadline);
};

/**
 * Calculate days until deadline
 * @param {Date|string} deadline - Deadline date
 * @returns {number} - Days until deadline (negative if overdue)
 */
const daysUntilDeadline = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

module.exports = {
    isPastDate,
    isFutureDate,
    addDays,
    formatDate,
    isDeadlineApproaching,
    isOverdue,
    daysUntilDeadline,
};
