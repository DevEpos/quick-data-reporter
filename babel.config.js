module.exports = api => {
    "use strict";

    api.cache(true);
    const presets = ["@babel/preset-env", "transform-ui5"];
    const plugins = ["@babel/plugin-proposal-class-properties"];

    return {
        presets,
        plugins
    };
};
