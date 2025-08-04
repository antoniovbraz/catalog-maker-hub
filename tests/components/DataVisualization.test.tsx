import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

describe('Componente DataVisualization', () => {
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

  it('deve filtrar dados ao buscar por termo', async () => {
    const user = userEvent.setup();

    render(
      <DataVisualization
        title="Busca"
        data={mockData}
        columns={mockColumns}
      />, { wrapper: createWrapper() }
    );

    const input = screen.getByPlaceholderText('Buscar...');
    await user.type(input, 'Item 1');

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
  });

  it('deve ordenar dados ao clicar no cabeçalho', async () => {
    const user = userEvent.setup();

    const data = [
      { id: '1', name: 'Beta', status: 'active' },
      { id: '2', name: 'Alpha', status: 'inactive' },
    ];

    const columns = [
      { key: 'name', header: 'Nome', sortable: true },
    ];

    render(
      <DataVisualization
        title="Ordenação"
        data={data}
        columns={columns}
      />, { wrapper: createWrapper() }
    );

    const header = screen.getByText('Nome');
    await user.click(header);

    let rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Alpha')).toBeInTheDocument();

    await user.click(header);
    rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Beta')).toBeInTheDocument();
  });

  it('deve paginar os resultados', async () => {
    const user = userEvent.setup();

    const data = [
      { id: '1', name: 'Item 1', status: 'active' },
      { id: '2', name: 'Item 2', status: 'inactive' },
      { id: '3', name: 'Item 3', status: 'active' },
    ];

    render(
      <DataVisualization
        title="Paginação"
        data={data}
        columns={mockColumns}
        itemsPerPage={1}
      />, { wrapper: createWrapper() }
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();

    const next = screen.getByRole('button', { name: 'Próxima' });
    await user.click(next);

    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();

    const prev = screen.getByRole('button', { name: 'Anterior' });
    await user.click(prev);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('deve chamar onViewModeChange ao alterar modo de visualização', async () => {
    const user = userEvent.setup();
    const mockChange = vi.fn();

    render(
      <DataVisualization
        title="Modo"
        data={mockData}
        columns={mockColumns}
        onViewModeChange={mockChange}
        viewMode="table"
      />, { wrapper: createWrapper() }
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);
    expect(mockChange).toHaveBeenCalledWith('grid');

    await user.click(buttons[0]);
    expect(mockChange).toHaveBeenCalledWith('table');
  });

  it('deve exibir ações extras no menu dropdown', async () => {
    const user = userEvent.setup();
    const extraAction = vi.fn();

    render(
      <DataVisualization
        title="Dropdown"
        data={mockData}
        columns={mockColumns}
        actions={[
          { label: 'Editar', onClick: vi.fn() },
          { label: 'Excluir', onClick: vi.fn() },
          { label: 'Ver', onClick: extraAction }
        ]}
      />, { wrapper: createWrapper() }
    );

    const row = screen.getAllByRole('row')[1];
    const actionButtons = within(row).getAllByRole('button');
    const menuButton = actionButtons[2];
    await user.click(menuButton);

    const menuItem = await screen.findByText('Ver');
    await user.click(menuItem);

    expect(extraAction).toHaveBeenCalledWith(mockData[0]);
  });
});

