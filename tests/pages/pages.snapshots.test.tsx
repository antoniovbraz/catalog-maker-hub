import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { testUtils } from '../setup';

import AdGenerator from '@/pages/AdGenerator';
import Subscription from '@/pages/Subscription';
import AdminDashboard from '@/pages/AdminDashboard';
import Dashboard from '@/pages/Dashboard';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { role: 'admin' } })
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

const pages = [
  { name: 'AdGenerator', Component: AdGenerator },
  { name: 'Subscription', Component: Subscription },
  { name: 'AdminDashboard', Component: AdminDashboard },
  { name: 'Dashboard', Component: Dashboard },
];

describe('Snapshots das páginas principais', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  pages.forEach(({ name, Component }) => {
    it(`deve renderizar ${name} corretamente`, () => {
      const { container } = renderWithProviders(<Component />);
      expect(container).toMatchSnapshot();
    });
  });
});
