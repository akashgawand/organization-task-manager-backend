const { ZodError } = require('zod');

/**
 * Validate request data against Zod schema
 * @param {Object} schema - Zod schema object with optional body, query, params
 */
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate body
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }

            // Validate query parameters
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }

            // Validate route parameters
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors,
                });
            }

            next(error);
        }
    };
};

module.exports = { validate };
