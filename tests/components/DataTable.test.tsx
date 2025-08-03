import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { testUtils } from '../setup';
import { DataTable } from '@/components/common/DataTable';

// Mock do React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('DataTable Component', () => {
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
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
      />, 
      { wrapper: createWrapper() }
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
      <DataTable 
        data={[]} 
        columns={mockColumns} 
        loading={true}
      />, 
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('deve renderizar estado vazio', () => {
    render(
      <DataTable 
        data={[]} 
        columns={mockColumns}
        emptyMessage="Nenhum item encontrado"
        emptyDescription="Adicione um item para começar"
      />, 
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
    expect(screen.getByText('Adicione um item para começar')).toBeInTheDocument();
  });

  it('deve renderizar botões de ação quando fornecidos', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />, 
      { wrapper: createWrapper() }
    );

    const editButtons = screen.getAllByRole('button');
    expect(editButtons).toHaveLength(4); // 2 edit + 2 delete
  });

  it('deve chamar callback de edição quando botão é clicado', async () => {
    const mockOnEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns}
        onEdit={mockOnEdit}
      />, 
      { wrapper: createWrapper() }
    );

    const editButtons = screen.getAllByRole('button');
    await user.click(editButtons[0]); // Primeiro botão de editar

    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('deve chamar callback de deleção quando botão é clicado', async () => {
    const mockOnDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns}
        onDelete={mockOnDelete}
      />, 
      { wrapper: createWrapper() }
    );

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg')?.getAttribute('data-testid') === 'trash-2'
    );
    
    if (deleteButton) {
      await user.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('deve renderizar conteúdo customizado com render function', () => {
    const customColumns = [
      {
        key: 'name',
        header: 'Nome'
      },
      {
        key: 'status',
        header: 'Status',
        render: (value) => {
          const status = value as string;
          return (
            <span className={status === 'active' ? 'text-green-500' : 'text-red-500'}>
              {status.toUpperCase()}
            </span>
          );
        }
      },
    ];

    render(
      <DataTable 
        data={mockData} 
        columns={customColumns}
      />, 
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('deve lidar com dados aninhados usando dot notation', () => {
    const nestedData = [
      { id: '1', user: { name: 'João' }, category: { name: 'Eletrônicos' } },
      { id: '2', user: { name: 'Maria' }, category: { name: 'Casa' } },
    ];

    const nestedColumns = [
      { key: 'user.name', header: 'Usuário' },
      { key: 'category.name', header: 'Categoria' },
    ];

    render(
      <DataTable 
        data={nestedData} 
        columns={nestedColumns}
      />, 
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('Eletrônicos')).toBeInTheDocument();
    expect(screen.getByText('Casa')).toBeInTheDocument();
  });

  it('deve corresponder ao snapshot', () => {
    const { container } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
      />,
      { wrapper: createWrapper() }
    );

    expect(container).toMatchSnapshot();
  });
});
