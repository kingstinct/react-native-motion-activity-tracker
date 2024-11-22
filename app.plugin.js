const { createRunOncePlugin } = require("expo/config-plugins");

const withMotionActivityPermissions =
  require("./config-plugin/withMotionActivityPermissions").default;
const pkg = require("./package.json");

module.exports = createRunOncePlugin(
  withMotionActivityPermissions,
  pkg.name,
  pkg.version,
);
