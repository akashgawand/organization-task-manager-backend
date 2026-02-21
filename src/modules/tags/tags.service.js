const { PrismaClient } = require('@prisma/client');
const { getPagination } = require('../../utils/pagination');

const prisma = new PrismaClient();

const createTag = async (data) => {
    const { name, color } = data;

    // Check if tag already exists
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) {
        throw new Error('Tag with this name already exists');
    }

    const tag = await prisma.tag.create({
        data: { name, color },
        include: {
            _count: {
                select: {
                    projects: true,
                    tasks: true,
                },
            },
        },
    });

    return tag;
};

const getTags = async (query) => {
    const { page = 1, limit = 50, search } = query;
    const { skip, take } = getPagination(page, limit);

    const where = {};

    if (search) {
        where.name = { contains: search };
    }

    const [tags, total] = await Promise.all([
        prisma.tag.findMany({
            where,
            skip,
            take,
            include: {
                _count: {
                    select: {
                        projects: true,
                        tasks: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        }),
        prisma.tag.count({ where }),
    ]);

    return {
        data: tags,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getTagById = async (id) => {
    const tag = await prisma.tag.findUnique({
        where: { tag_id: parseInt(id) },
        include: {
            projects: {
                select: {
                    project_id: true,
                    name: true,
                    status: true,
                },
            },
            tasks: {
                select: {
                    task_id: true,
                    title: true,
                    status: true,
                },
            },
        },
    });

    if (!tag) {
        throw new Error('Tag not found');
    }

    return tag;
};

const updateTag = async (id, data) => {
    const { name, color } = data;

    const tag = await prisma.tag.findUnique({ where: { tag_id: parseInt(id) } });
    if (!tag) {
        throw new Error('Tag not found');
    }

    // Check if new name conflicts with existing tag
    if (name && name !== tag.name) {
        const existing = await prisma.tag.findUnique({ where: { name } });
        if (existing) {
            throw new Error('Tag with this name already exists');
        }
    }

    const updatedTag = await prisma.tag.update({
        where: { tag_id: parseInt(id) },
        data: { name, color },
        include: {
            _count: {
                select: {
                    projects: true,
                    tasks: true,
                },
            },
        },
    });

    return updatedTag;
};

const deleteTag = async (id) => {
    const tag = await prisma.tag.findUnique({ where: { tag_id: parseInt(id) } });
    if (!tag) {
        throw new Error('Tag not found');
    }

    await prisma.tag.delete({ where: { tag_id: parseInt(id) } });
};

module.exports = {
    createTag,
    getTags,
    getTagById,
    updateTag,
    deleteTag,
};
