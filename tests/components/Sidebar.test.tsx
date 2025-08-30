import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ profile: null }),
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/use-sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

function SidebarState() {
  const { open } = useSidebar();
  return <div>{open ? 'open' : 'closed'}</div>;
}

describe('SidebarProvider responsive behavior', () => {
  it('closes by default on mobile screens', () => {
    render(
      <SidebarProvider>
        <SidebarState />
      </SidebarProvider>
    );

    expect(screen.getByText('closed')).toBeInTheDocument();
  });

  it('opens by default on desktop screens', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query.includes('min-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <SidebarProvider>
        <SidebarState />
      </SidebarProvider>
    );

    expect(screen.getByText('open')).toBeInTheDocument();
    window.matchMedia = originalMatchMedia;
  });
});

describe('AppSidebar accessibility', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query.includes('min-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('provides accessible labels when collapsed', () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>
    );

    const [configButton] = screen.getAllByRole('button', { name: /configurações/i });
    expect(configButton).toBeInTheDocument();
  });

  it('allows keyboard navigation through items', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>
    );

    await user.tab();
    const [dashboardLink] = screen.getAllByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: /estratégia/i })).toHaveFocus();

    await user.tab();
    const [configButton] = screen.getAllByRole('button', { name: /configurações/i });
    expect(configButton).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: /marketplaces/i })).toHaveFocus();
  }, 10000);
});
