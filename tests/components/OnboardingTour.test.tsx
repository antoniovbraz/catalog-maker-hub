import { describe, it, expect, vi } from 'vitest';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { full_name: 'Usuário Teste' } }),
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';


describe('OnboardingTour', () => {
  it('permite navegar entre passos com Próximo e Anterior', async () => {
    const user = userEvent.setup();

    render(<OnboardingTour onComplete={() => {}} onSkip={() => {}} />);
    expect(
      screen.getByRole('heading', { name: /Bem-vindo ao Peepers Hub!/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Próximo/i }));
    expect(
      screen.getByRole('heading', { name: /Explore as Funcionalidades/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(
      screen.getByRole('heading', { name: /Bem-vindo ao Peepers Hub!/i })
    ).toBeInTheDocument();
  });

  it('avança usando ações personalizadas', async () => {
    const user = userEvent.setup();

    render(<OnboardingTour onComplete={() => {}} onSkip={() => {}} />);

    // Ir para o segundo passo
    await user.click(screen.getByRole('button', { name: /Próximo/i }));
    // Ação personalizada do segundo passo
    await user.click(screen.getByRole('button', { name: /Ver Dashboard/i }));
    expect(
      screen.getByRole('heading', { name: /Configure seu Primeiro Produto/i })
    ).toBeInTheDocument();

    // Ação personalizada do terceiro passo
    await user.click(screen.getByRole('button', { name: /Adicionar Produto/i }));
    expect(
      screen.getByRole('heading', { name: /Pronto para Vender!/i })
    ).toBeInTheDocument();
  });

  it('chama onSkip ao clicar em Pular tour', async () => {
    const onSkip = vi.fn();
    const user = userEvent.setup();

    render(<OnboardingTour onComplete={() => {}} onSkip={onSkip} />);

    await user.click(screen.getByRole('button', { name: /Pular tour/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('chama onComplete ao finalizar o tour', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();

    render(<OnboardingTour onComplete={onComplete} onSkip={() => {}} />);

    await user.click(screen.getByRole('button', { name: /Próximo/i }));
    await user.click(screen.getByRole('button', { name: /Próximo/i }));
    await user.click(screen.getByRole('button', { name: /Próximo/i }));

    expect(
      screen.getByRole('heading', { name: /Pronto para Vender!/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Finalizar/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

