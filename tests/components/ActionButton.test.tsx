import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionButton } from '@/components/common/ActionButton';

describe('Componente ActionButton', () => {
  it('renderiza ícone e label', () => {
    render(<ActionButton icon={<svg data-testid="icon" />} label="Salvar" onClick={() => {}} />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });

  it('exibe estado de loading com texto e animação', () => {
    render(<ActionButton icon={<svg data-testid="icon" />} label="Salvar" loading onClick={() => {}} />);

    const icon = screen.getByTestId('icon');
    expect(screen.getByText('Processando...')).toBeInTheDocument();
    expect(icon.parentElement).toHaveClass('animate-spin');
  });

  it('mostra tooltip quando fornecido', async () => {
    const user = userEvent.setup();

    render(
      <ActionButton
        icon={<svg data-testid="icon" />}
        label="Info"
        tooltip="Dica"
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(button);

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Dica');
  });

  it('dispara onClick ao ser clicado', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <ActionButton
        icon={<svg data-testid="icon" />}
        label="Clique"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

