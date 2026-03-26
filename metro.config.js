const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  blockList: [
    /\.local\/.*/,
  ],
  extraNodeModules: {
    semver: path.resolve(
      __dirname,
      "node_modules/react-native-worklets/node_modules/semver"
    ),
  },
};

module.exports = config;
