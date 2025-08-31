import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testUtils } from '../setup';
import { createWrapper } from '../utils/query-wrapper';
import { DataVisualization } from '@/components/ui/data-visualization';

const { wrapper, queryClient } = createWrapper();

afterEach(() => {
  queryClient.clear();
  queryClient.removeQueries();
});

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
      />, { wrapper }
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
      />, { wrapper }
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
      />, { wrapper }
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
      />, { wrapper }
    );

    const row = screen.getByRole('row', { name: /Item 1/i });
    const button = within(row).getByRole('button', { name: /Editar/i });
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
      />, { wrapper }
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
      />, { wrapper }
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
      />, { wrapper }
    );

    const header = screen.getByText('Nome');
    await user.click(header);

    let alphaRow = screen.getByRole('row', { name: /Alpha/i });
    let betaRow = screen.getByRole('row', { name: /Beta/i });
    expect(
      alphaRow.compareDocumentPosition(betaRow) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await user.click(header);
    betaRow = screen.getByRole('row', { name: /Beta/i });
    alphaRow = screen.getByRole('row', { name: /Alpha/i });
    expect(
      betaRow.compareDocumentPosition(alphaRow) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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
      />, { wrapper }
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
      />, { wrapper }
    );

    const gridButton = screen.getByRole('button', { name: /modo grade/i });
    await user.click(gridButton);
    expect(mockChange).toHaveBeenCalledWith('grid');

    const tableButton = screen.getByRole('button', { name: /modo tabela/i });
    await user.click(tableButton);
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
      />, { wrapper }
    );

    const row = screen.getByRole('row', { name: /Item 1/i });
    const menuButton = within(row).getByRole('button', { name: /mais ações/i });
    await user.click(menuButton);

    const menuItem = await screen.findByRole('menuitem', { name: /Ver/i });
    await user.click(menuItem);

    expect(extraAction).toHaveBeenCalledWith(mockData[0]);
  });
});

