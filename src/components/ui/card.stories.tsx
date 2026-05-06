import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

const meta = {
  title: "UI/DataDisplay/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    size: "default",
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-[360px]">
      <CardHeader>
        <CardTitle>Starter plan</CardTitle>
        <CardDescription>Perfect for personal projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>$19/month</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Choose plan</Button>
      </CardFooter>
    </Card>
  ),
}

export const Small: Story = {
  render: () => (
    <Card size="sm" className="w-[320px]">
      <CardHeader>
        <CardTitle>Compact card</CardTitle>
        <CardDescription>Reduced spacing with `size=\"sm\"`.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Useful for dense dashboards.</p>
      </CardContent>
    </Card>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your preferences.</CardDescription>
        <CardAction>
          <Button size="sm" variant="ghost">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Weekly digest enabled.</p>
      </CardContent>
    </Card>
  ),
}
