const sass = require('node-sass');
const parseurl = require('parseurl');
const log = require('@ui5/logger').getLogger('server:customMiddleware:sass');

/**
 * UI5 Server middleware to compile scss files
 *
 * @param {Object} parameters Parameters
 * @param {Object} parameters.resources Resource collections
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.all Reader or Collection to read resources of the
 *                                        root project and its dependencies
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.rootProject Reader or Collection to read resources of
 *                                        the project the server is started in
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.dependencies Reader or Collection to read resources of
 *                                        the projects dependencies
 * @param {Object} parameters.options Options
 * @param {string} [parameters.options.configuration] Custom server middleware configuration if given in ui5.yaml
 * @returns {function} Middleware function to use
 */
module.exports = ({ resources, options }) => {
    const { debug = false } = options.configuration;

    return async (req, res, next) => {
        if (req.path.endsWith('.css') && !req.path.includes('resources/')) {
            try {
                const pathname = parseurl(req).pathname.replace('.css', '.scss');

                // grab the file via @ui5/fs.AbstractReader API
                const resource = await resources.rootProject.byPath(pathname);
                if (debug) {
                    log.info(`handling ${req.path}...`);
                }
                if (!resource) {
                    log.warn(`...file not found: ${resource.getPath()}!`);
                    next();
                }
                // read file into string
                const source = await resource.getString();
                if (debug) {
                    log.info(`...${pathname} compiled!`);
                }
                const compiledResult = await new Promise((resolve, reject) => {
                    sass.render({ data: source }, (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    });
                });
                // send out compiled scss file
                res.type('.css');
                res.end(compiledResult.css);
            } catch (err) {
                log.error(err);
                next();
            }
        } else {
            next();
        }
    };
};
