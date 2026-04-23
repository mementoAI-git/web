import type { Preview } from '@storybook/react-vite'
import { createElement, type ReactNode } from "react"

import "../src/index.css"
import "dialkit/styles.css"
import "react-spring-bottom-sheet/dist/style.css"

function AppShellDecorator({ children }: { children: ReactNode }) {
  return createElement(
    "div",
    { className: "min-h-screen bg-background p-6 text-secondary" },
    children
  )
}

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for all stories",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) =>
      createElement(
        "div",
        { className: context.globals.theme === "dark" ? "dark" : undefined },
        createElement(AppShellDecorator, {}, createElement(Story))
      ),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;