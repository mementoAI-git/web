import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/react-vite",
  async viteFinal(config) {
    const existingIgnored = config.server?.watch;
    const ignoredPaths =
      existingIgnored && Array.isArray(existingIgnored.ignored)
        ? existingIgnored.ignored
        : [];

    return {
      ...config,
      server: {
        ...config.server,
        watch: {
          ...config.server?.watch,
          ignored: [
            "**/storybook-static/**",
            ...ignoredPaths,
          ],
        },
      },
    };
  }
};
export default config;