import type { Meta, StoryObj } from '@storybook/react';
import { AppHeader } from './AppHeader';

const meta: Meta<typeof AppHeader> = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof AppHeader>;

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'responsive' } },
};
