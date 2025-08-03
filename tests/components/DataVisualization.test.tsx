import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { testUtils } from '../setup';
import { DataVisualization } from '@/components/ui/data-visualization';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('DataVisualization Component', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  const mockData = [
    { id: '1', name: 'Item 1', status: 'active' },
    { id: '2', name: 'Item 2', status: 'inactive' },
  ];

  const mockColumns = [
    { key: 'name', header: 'Nome' },
    { key: 'status', header: 'Status' },
  ];

  it('deve renderizar tabela com dados', () => {
    render(
      <DataVisualization
        title="Teste"
        data={mockData}
        columns={mockColumns}
      />, { wrapper: createWrapper() }
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });

  it('deve renderizar estado de loading', () => {
    render(
      <DataVisualization
        title="Carregando"
        data={[]}
        columns={mockColumns}
        isLoading={true}
      />, { wrapper: createWrapper() }
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('deve renderizar estado vazio', () => {
    render(
      <DataVisualization
        title="Vazio"
        data={[]}
        columns={mockColumns}
        emptyState={(
          <div>
            <p>Nenhum item encontrado</p>
            <p>Adicione um item para começar</p>
          </div>
        )}
      />, { wrapper: createWrapper() }
    );

    expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
    expect(screen.getByText('Adicione um item para começar')).toBeInTheDocument();
  });

  it('deve renderizar botões de ação e chamar callback', async () => {
    const mockAction = vi.fn();
    const user = userEvent.setup();

    render(
      <DataVisualization
        title="Ações"
        data={mockData}
        columns={mockColumns}
        actions={[{ label: 'Editar', onClick: mockAction }]}
      />, { wrapper: createWrapper() }
    );

    const button = screen.getAllByRole('button')[0];
    await user.click(button);
    expect(mockAction).toHaveBeenCalledWith(mockData[0]);
  });

  it('deve lidar com dados aninhados usando dot notation', () => {
    const nestedData = [
      { id: '1', user: { name: 'João' } },
      { id: '2', user: { name: 'Maria' } },
    ];

    const nestedColumns = [
      { key: 'user.name', header: 'Usuário' },
    ];

    render(
      <DataVisualization
        title="Aninhado"
        data={nestedData}
        columns={nestedColumns}
      />, { wrapper: createWrapper() }
    );

    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
  });
});

