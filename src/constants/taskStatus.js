const TASK_STATUS = {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW: 'REVIEW',
    DONE: 'DONE',
    BLOCKED: 'BLOCKED',
};

const TASK_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
};

const SUBMISSION_STATUS = {
    PENDING_REVIEW: 'PENDING_REVIEW',
    SENT_BACK: 'SENT_BACK',
    APPROVED: 'APPROVED',
};

// Task status lifecycle transitions
const STATUS_TRANSITIONS = {
    [TASK_STATUS.TODO]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.BLOCKED],
    [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.REVIEW, TASK_STATUS.BLOCKED, TASK_STATUS.TODO],
    [TASK_STATUS.REVIEW]: [TASK_STATUS.DONE, TASK_STATUS.IN_PROGRESS],
    [TASK_STATUS.BLOCKED]: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS],
    [TASK_STATUS.DONE]: [],
};

const canTransitionTo = (currentStatus, newStatus) => {
    return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

const isValidTransition = (currentStatus, newStatus, userRole = null, isCreator = false) => {
    if (currentStatus === newStatus) {
        return true;
    }

    // Super Admins, Admins, and the Task Creator can move tasks to ANY state.
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || isCreator) {
        // As long as it's a valid enum value
        return Object.values(TASK_STATUS).includes(newStatus);
    }

    return canTransitionTo(currentStatus, newStatus);
};

// Activity types for logging
const ACTIVITY_TYPES = {
    TASK_CREATED: 'TASK_CREATED',
    TASK_ASSIGNED: 'TASK_ASSIGNED',
    TASK_UPDATED: 'TASK_UPDATED',
    TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
    TASK_SUBMITTED: 'TASK_SUBMITTED',
    TASK_REVIEWED: 'TASK_REVIEWED',
    TASK_APPROVED: 'TASK_APPROVED',
    TASK_REJECTED: 'TASK_REJECTED',
    TASK_VERIFIED: 'TASK_VERIFIED',
    TASK_COMPLETED: 'TASK_COMPLETED',
    PROJECT_CREATED: 'PROJECT_CREATED',
    PROJECT_UPDATED: 'PROJECT_UPDATED',
    PHASE_CREATED: 'PHASE_CREATED',
    PHASE_UPDATED: 'PHASE_UPDATED',
};

module.exports = {
    TASK_STATUS,
    TASK_PRIORITY,
    SUBMISSION_STATUS,
    STATUS_TRANSITIONS,
    canTransitionTo,
    isValidTransition,
    ACTIVITY_TYPES,
};
