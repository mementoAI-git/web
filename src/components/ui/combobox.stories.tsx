import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "./combobox"

const meta = {
  title: "UI/Form/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { value: "personal", label: "Personal" },
  { value: "family", label: "Family" },
  { value: "work", label: "Work" },
  { value: "travel", label: "Travel" },
]

export const Default: Story = {
  render: () => (
    <Combobox defaultValue={options[0]?.value}>
      <ComboboxInput placeholder="Select a category" showClear />
      <ComboboxContent>
        <ComboboxEmpty>No results</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection items={options}>
            {(item) => (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
}

export const Grouped: Story = {
  render: () => (
    <Combobox defaultValue="family">
      <ComboboxInput placeholder="Select a category" />
      <ComboboxContent>
        <ComboboxEmpty>No results</ComboboxEmpty>
        <ComboboxList>
          <ComboboxGroup>
            <ComboboxLabel>Popular</ComboboxLabel>
            <ComboboxItem value="personal">Personal</ComboboxItem>
            <ComboboxItem value="family">Family</ComboboxItem>
          </ComboboxGroup>
          <ComboboxGroup>
            <ComboboxLabel>More</ComboboxLabel>
            <ComboboxItem value="work">Work</ComboboxItem>
            <ComboboxItem value="travel">Travel</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
}
