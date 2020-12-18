module.exports = api => {
    "use strict";

    api.cache(true);
    const presets = ["@babel/preset-env"];

    return {
        presets
    };
};
