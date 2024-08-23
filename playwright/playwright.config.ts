import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  use: {
    screenshot: "only-on-failure",
  },
  // other config options...
};

export default config;
