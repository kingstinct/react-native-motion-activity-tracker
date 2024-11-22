import { withInfoPlist, withAndroidManifest } from "@expo/config-plugins";
import withMotionActivityPermissions from "../config-plugin/withMotionActivityPermissions";
import type { ExpoConfig } from "@expo/config-types";

interface ExpoConfigWithModResults extends ExpoConfig {
  modResults?: {
    // For iOS
    NSMotionUsageDescription?: string;
    // For Android
    manifest?: {
      "uses-permission"?: Array<{ $: { "android:name": string } }>;
    };
  };
}

jest.mock("@expo/config-plugins", () => ({
  withInfoPlist: jest.fn((config, callback) => {
    const updatedConfig = {
      ...config,
      modResults: {
        ...config.modResults,
        NSMotionUsageDescription: undefined, 
      },
    };
    const modifiedConfig = callback(updatedConfig);
    return {
      ...config,
      modResults: { ...updatedConfig.modResults, ...modifiedConfig.modResults },
    };
  }),
  withAndroidManifest: jest.fn((config, callback) => {
    const updatedConfig = {
      ...config,
      modResults: {
        ...config.modResults,
        manifest: {
          ...config.modResults?.manifest,
          "uses-permission": [], 
        },
      },
    };
    const modifiedConfig = callback(updatedConfig);
    return {
      ...config,
      modResults: { ...updatedConfig.modResults, ...modifiedConfig.modResults },
    };
  }),
}));

describe("withMotionActivityPermissions", () => {
  it("should add iOS motion activity permissions", () => {
    const config: ExpoConfigWithModResults = {
      name: "mock-app",
      slug: "mock-app",
      modResults: {
        NSMotionUsageDescription: undefined,
      },
    };

    const updatedConfig: ExpoConfigWithModResults =
      withMotionActivityPermissions(config);

    expect(updatedConfig.modResults?.NSMotionUsageDescription).toBe(
      "This app uses motion activity tracking."
    );

    expect(withInfoPlist).toHaveBeenCalled();
  });

  it("should add Android motion activity recognition permission", () => {
    const config: ExpoConfigWithModResults = {
      name: "mock-app",
      slug: "mock-app",
      modResults: {
        manifest: {
          "uses-permission": [],
        },
      },
    };

    const updatedConfig: ExpoConfigWithModResults =
      withMotionActivityPermissions(config);

    const permissions = updatedConfig.modResults?.manifest?.["uses-permission"];
    expect(permissions).toEqual(
      expect.arrayContaining([
        { $: { "android:name": "android.permission.ACTIVITY_RECOGNITION" } },
      ])
    );

    expect(withAndroidManifest).toHaveBeenCalled();
  });
});
