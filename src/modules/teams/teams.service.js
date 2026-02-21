const { PrismaClient } = require('@prisma/client');
const { getPaginationParams } = require('../../utils/pagination');

const prisma = new PrismaClient();

const createTeam = async (data, creatorId) => {
    const { name, description, lead_id, member_ids, status, avatar } = data;

    // Verify lead exists
    const lead = await prisma.user.findUnique({ where: { user_id: lead_id } });
    if (!lead) {
        throw new Error('Team lead not found');
    }

    // Verify all members exist
    if (member_ids && member_ids.length > 0) {
        const members = await prisma.user.findMany({
            where: { user_id: { in: member_ids } },
        });
        if (members.length !== member_ids.length) {
            throw new Error('One or more members not found');
        }
    }

    const team = await prisma.team.create({
        data: {
            name,
            description,
            lead_id,
            status: status || 'ACTIVE',
            avatar,
            members: member_ids
                ? { connect: member_ids.map((id) => ({ user_id: id })) }
                : undefined,
        },
        include: {
            lead: {
                select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                    role: true,
                    avatar: true,
                },
            },
            members: {
                select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                    role: true,
                    avatar: true,
                },
            },
            projects: {
                select: {
                    project_id: true,
                    name: true,
                    status: true,
                },
            },
        },
    });

    return team;
};

const getTeams = async (query) => {
    const { page = 1, limit = 10, search, status } = query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = {};

    if (search) {
        where.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
        ];
    }

    if (status) {
        where.status = status;
    }

    const [teams, total] = await Promise.all([
        prisma.team.findMany({
            where,
            skip,
            take,
            include: {
                lead: {
                    select: {
                        user_id: true,
                        full_name: true,
                        email: true,
                        avatar: true,
                    },
                },
                members: {
                    select: {
                        user_id: true,
                        full_name: true,
                        email: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        projects: true,
                        members: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        }),
        prisma.team.count({ where }),
    ]);

    return {
        data: teams,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getTeamById = async (id) => {
    const team = await prisma.team.findUnique({
        where: { team_id: parseInt(id) },
        include: {
            lead: {
                select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                    role: true,
                    avatar: true,
                    department: true,
                    position: true,
                },
            },
            members: {
                select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                    role: true,
                    avatar: true,
                    department: true,
                    position: true,
                },
            },
            projects: {
                select: {
                    project_id: true,
                    name: true,
                    description: true,
                    status: true,
                    progress: true,
                },
            },
        },
    });

    if (!team) {
        throw new Error('Team not found');
    }

    return team;
};

const updateTeam = async (id, data) => {
    const { name, description, lead_id, status, avatar } = data;

    const team = await prisma.team.findUnique({
        where: { team_id: parseInt(id) },
    });

    if (!team) {
        throw new Error('Team not found');
    }

    if (lead_id) {
        const lead = await prisma.user.findUnique({ where: { user_id: lead_id } });
        if (!lead) {
            throw new Error('Team lead not found');
        }
    }

    const updatedTeam = await prisma.team.update({
        where: { team_id: parseInt(id) },
        data: {
            name,
            description,
            lead_id,
            status,
            avatar,
        },
        include: {
            lead: {
                select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                    role: true,
                    avatar: true,
                },
            },
            members: {
                select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    return updatedTeam;
};

const deleteTeam = async (id) => {
    const team = await prisma.team.findUnique({
        where: { team_id: parseInt(id) },
    });

    if (!team) {
        throw new Error('Team not found');
    }

    await prisma.team.delete({
        where: { team_id: parseInt(id) },
    });
};

const addMember = async (teamId, userId) => {
    const team = await prisma.team.findUnique({
        where: { team_id: parseInt(teamId) },
    });

    if (!team) {
        throw new Error('Team not found');
    }

    const user = await prisma.user.findUnique({
        where: { user_id: parseInt(userId) },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const updatedTeam = await prisma.team.update({
        where: { team_id: parseInt(teamId) },
        data: {
            members: {
                connect: { user_id: parseInt(userId) },
            },
        },
        include: {
            lead: true,
            members: true,
        },
    });

    return updatedTeam;
};

const removeMember = async (teamId, userId) => {
    const team = await prisma.team.findUnique({
        where: { team_id: parseInt(teamId) },
    });

    if (!team) {
        throw new Error('Team not found');
    }

    const updatedTeam = await prisma.team.update({
        where: { team_id: parseInt(teamId) },
        data: {
            members: {
                disconnect: { user_id: parseInt(userId) },
            },
        },
        include: {
            lead: true,
            members: true,
        },
    });

    return updatedTeam;
};

module.exports = {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
};
