import { describe, it, expect, vi } from 'vitest';
import { handleSupabaseError, logError } from '@/utils/errors';
import { logger } from '@/utils/logger';

describe('handleSupabaseError', () => {
  it('deve retornar mensagem correta para código PGRST116', () => {
    expect(handleSupabaseError({ code: 'PGRST116' })).toBe('Registro não encontrado');
  });

  it('deve retornar mensagem correta para código 23505', () => {
    expect(handleSupabaseError({ code: '23505' })).toBe('Já existe uma regra para esta combinação de marketplace e categoria');
  });

  it('deve retornar mensagem correta para código 23503', () => {
    expect(handleSupabaseError({ code: '23503' })).toBe('Não é possível deletar: existem registros relacionados');
  });

  it('deve detectar mensagens com "duplicate key"', () => {
    expect(handleSupabaseError({ message: 'duplicate key value violates unique constraint' })).toBe('Já existe um registro com essas informações');
  });

  it('deve detectar mensagens com "foreign key"', () => {
    expect(handleSupabaseError({ message: 'insert or update on table violates foreign key constraint' })).toBe('Referência inválida: verifique os dados relacionados');
  });

  it('deve detectar UUID inválido', () => {
    expect(handleSupabaseError({ message: 'invalid input syntax for type uuid: "abc"' })).toBe('ID inválido fornecido. Verifique os dados selecionados');
  });

  it('deve detectar violação de check constraint', () => {
    expect(handleSupabaseError({ message: 'new row violates check constraint "constraint_name"' })).toBe('Dados inválidos: verifique se todos os valores estão dentro dos limites permitidos');
  });

  it('deve retornar mensagem original quando não mapeada', () => {
    expect(handleSupabaseError({ message: 'Algum erro desconhecido' })).toBe('Algum erro desconhecido');
  });

  it('deve retornar mensagem padrão quando não há informações', () => {
    expect(handleSupabaseError({})).toBe('Erro inesperado');
  });
});

describe('logError', () => {
  it('deve enviar dados corretos ao logger', () => {
    const error = new Error('Falha de teste');
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    logError(error);

    expect(spy).toHaveBeenCalledTimes(1);
    const [message, context, data] = spy.mock.calls[0];
    expect(message).toBe('Falha de teste');
    expect(context).toBe('ERROR');
    expect(data).toMatchObject({
      name: 'Error',
      stack: error.stack,
    });
    expect(typeof (data as any).timestamp).toBe('string');

    spy.mockRestore();
  });

  it('deve permitir contexto customizado', () => {
    const error = new Error('Outro erro');
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    logError(error, 'CUSTOM');

    expect(spy).toHaveBeenCalledWith('Outro erro', 'CUSTOM', expect.any(Object));

    spy.mockRestore();
  });
});
