const path = require('path');
const sass = require('node-sass');
const fs = require('fs');
const log = require('@ui5/logger').getLogger('builder:customtask:sass');

/**
 * Task to transpiles ES6 code into ES5 code.
 *
 * @param {Object} parameters Parameters
 * @param {DuplexCollection} parameters.workspace DuplexCollection to read and write files
 * @param {AbstractReader} parameters.dependencies Reader or Collection to read dependency files
 * @param {Object} parameters.options Options
 * @param {string} parameters.options.projectName Project name
 * @param {string} [parameters.options.configuration] Task configuration if given in ui5.yaml
 * @returns {Promise} Promise resolving with undefined once data has been written
 */
module.exports = async ({ workspace, dependencies, options }) => {
    const { debug = false, excludePatterns = [] } = options.configuration;
    const resources = await workspace.byGlob('/**/*.scss');
    return Promise.all(
        resources.map(async resource => {
            if (!excludePatterns.some(pattern => resource.getPath().includes(pattern))) {
                const value = await resource.getString();
                if (debug) {
                    log.info('Compiling file ' + resource.getPath());
                }
                try {
                    const result = await new Promise((resolve, reject) => {
                        sass.render({ data: value }, (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        });
                    });
                    resource.setString(result.css);
                    const sassFilePath = resource.getPath();
                    resource.setPath(sassFilePath.replace('.scss', '.css'));
                    workspace.write(resource);
                    // TODO: find a way to delete the .scss file from the dist folder
                } catch (error) {
                    log.error('Error during compiling Sass file');
                    return Promise.resolve();
                }
            } else {
                return Promise.resolve();
            }
        })
    );
};
