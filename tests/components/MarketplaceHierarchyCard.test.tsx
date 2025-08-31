import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketplaceHierarchyCard } from '@/components/marketplace/MarketplaceHierarchyCard';
import { MarketplaceHierarchy, MarketplaceType } from '@/types/marketplaces';

const createPlatform = (): MarketplaceType => ({
  id: 'platform-1',
  name: 'Plataforma Teste',
  description: 'Descrição da plataforma',
  url: 'https://plataforma.com',
  marketplace_type: 'platform',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const createModality = (id: string, name: string): MarketplaceType => ({
  id,
  name,
  description: `Descrição ${name}`,
  url: `https://${name.toLowerCase()}.com`,
  platform_id: 'platform-1',
  marketplace_type: 'modality',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('MarketplaceHierarchyCard', () => {
  it('renderiza plataforma e modalidades', () => {
    const hierarchy: MarketplaceHierarchy = {
      parent: createPlatform(),
      children: [
        createModality('mod-1', 'Modalidade A'),
        createModality('mod-2', 'Modalidade B'),
      ],
    };

    render(
      <MarketplaceHierarchyCard
        hierarchy={hierarchy}
        onEditPlatform={() => {}}
        onEditModality={() => {}}
        onAddModality={() => {}}
        onDeletePlatform={() => {}}
        onDeleteModality={() => {}}
      />
    );

    expect(screen.getByText('Plataforma Teste')).toBeInTheDocument();
    expect(screen.getByText('Modalidade A')).toBeInTheDocument();
    expect(screen.getByText('Modalidade B')).toBeInTheDocument();
  });

  it('dispara callbacks ao interagir', async () => {
    const hierarchy: MarketplaceHierarchy = {
      parent: createPlatform(),
      children: [createModality('mod-1', 'Modalidade A')],
    };

    const onEditPlatform = vi.fn();
    const onEditModality = vi.fn();
    const onAddModality = vi.fn();
    const onDeletePlatform = vi.fn();
    const onDeleteModality = vi.fn();
    const user = userEvent.setup();

    render(
      <MarketplaceHierarchyCard
        hierarchy={hierarchy}
        onEditPlatform={onEditPlatform}
        onEditModality={onEditModality}
        onAddModality={onAddModality}
        onDeletePlatform={onDeletePlatform}
        onDeleteModality={onDeleteModality}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Editar plataforma/i })
    );
    expect(onEditPlatform).toHaveBeenCalledWith(hierarchy.parent);

    await user.click(
      screen.getByRole('button', { name: /Excluir plataforma/i })
    );
    expect(onDeletePlatform).toHaveBeenCalledWith('platform-1');

    await user.click(screen.getByRole('button', { name: /Nova Modalidade/i }));
    expect(onAddModality).toHaveBeenCalledWith('platform-1');

    await user.click(
      screen.getByRole('button', { name: /Editar Modalidade A/i })
    );
    expect(onEditModality).toHaveBeenCalledWith(hierarchy.children[0]);

    await user.click(
      screen.getByRole('button', { name: /Excluir Modalidade A/i })
    );
    expect(onDeleteModality).toHaveBeenCalledWith('mod-1');
  });

  it('exibe estado vazio quando não há modalidades', async () => {
    const hierarchy: MarketplaceHierarchy = {
      parent: createPlatform(),
      children: [],
    };

    const onAddModality = vi.fn();
    const user = userEvent.setup();

    render(
      <MarketplaceHierarchyCard
        hierarchy={hierarchy}
        onEditPlatform={() => {}}
        onEditModality={() => {}}
        onAddModality={onAddModality}
        onDeletePlatform={() => {}}
        onDeleteModality={() => {}}
      />
    );

    expect(
      screen.getByText('Nenhuma modalidade cadastrada para esta plataforma')
    ).toBeInTheDocument();

    const addFirst = screen.getByRole('button', { name: /Adicionar Primeira Modalidade/i });
    await user.click(addFirst);
    expect(onAddModality).toHaveBeenCalledWith('platform-1');
  });
});

