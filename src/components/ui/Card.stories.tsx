import type { Meta, StoryObj } from "@storybook/react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./Card"

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-64">
      <CardHeader>
        <CardTitle>Default Card</CardTitle>
      </CardHeader>
      <CardContent>Conteúdo padrão do card.</CardContent>
    </Card>
  ),
}

export const Highlight: Story = {
  render: () => (
    <Card variant="highlight" className="w-64">
      <CardHeader>
        <CardTitle>Card em Destaque</CardTitle>
      </CardHeader>
      <CardContent>Informação importante.</CardContent>
    </Card>
  ),
}

export const Pricing: Story = {
  render: () => (
    <Card variant="pricing" className="w-64">
      <CardHeader className="text-center">
        <CardTitle>Plano Pro</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        R$29/mês
      </CardContent>
    </Card>
  ),
}
