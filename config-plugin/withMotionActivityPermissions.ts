import {
  withInfoPlist,
  withAndroidManifest,
  ConfigPlugin,
} from "@expo/config-plugins";

const withMotionActivityPermissions: ConfigPlugin = (config) => {
  // Add iOS motion activity permissions
  config = withInfoPlist(config, (config) => {
    config.modResults.NSMotionUsageDescription =
      config.modResults.NSMotionUsageDescription ||
      "This app uses motion activity tracking.";
    return config;
  });

  // Add Android Activity Recognition permission
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const permissions = androidManifest.manifest["uses-permission"] || [];
    permissions.push({
      $: { "android:name": "android.permission.ACTIVITY_RECOGNITION" },
    });
    androidManifest.manifest["uses-permission"] = permissions;
    return config;
  });

  return config;
};

export default withMotionActivityPermissions;
