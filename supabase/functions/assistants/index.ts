import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  logger.info(`=== ASSISTANTS ${req.method} REQUEST ===`);
  logger.debug('URL', req.url);
  logger.debug('Headers', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logger.debug('Handling OPTIONS request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Validar configurações essenciais
    if (!OPENAI_API_KEY) {
      logger.error('ERRO: OpenAI API key não configurada');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key não está configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    logger.debug('Path parts', pathParts);

    // Extrair o ID do assistente da URL se presente
    const assistantId = pathParts[pathParts.length - 1];
    logger.debug('Assistant ID extraído', assistantId);

    // Roteamento baseado no método HTTP
    switch (req.method) {
      case 'POST':
        logger.debug('Roteando para CREATE');
        return await handleCreateAssistant(req);
        
      case 'PUT':
        logger.debug('Roteando para UPDATE com ID', assistantId);
        if (!assistantId || assistantId === 'assistants') {
          return new Response(JSON.stringify({ 
            error: 'ID do assistente é obrigatório para atualização' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await handleUpdateAssistant(req, assistantId);
        
      case 'DELETE':
        logger.debug('Roteando para DELETE com ID', assistantId);
        if (!assistantId || assistantId === 'assistants') {
          return new Response(JSON.stringify({ 
            error: 'ID do assistente é obrigatório para deleção' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await handleDeleteAssistant(assistantId);
        
      default:
        logger.error('Método não suportado', req.method);
        return new Response(JSON.stringify({ 
          error: `Método ${req.method} não suportado` 
        }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    logger.error('ERRO GERAL na edge function', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleCreateAssistant(req: Request) {
  try {
    logger.info('=== INICIANDO CRIAÇÃO ===');
    const { name, marketplace, model, instructions, tenant_id } = await req.json();
    logger.debug('Dados recebidos', { name, marketplace, model, tenant_id });

    // Criar assistente na OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        name,
        model,
        instructions,
        description: `Assistente para ${marketplace} - ${name}`,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      logger.error('Erro da OpenAI', error);
      throw new Error(`Erro ao criar assistente na OpenAI: ${error}`);
    }

    const openaiAssistant = await openaiResponse.json();
    logger.info('Assistente criado na OpenAI', openaiAssistant.id);

    // Salvar no Supabase
    const { data, error } = await supabase
      .from('assistants')
      .insert({
        name,
        marketplace,
        model,
        instructions,
        assistant_id: openaiAssistant.id,
        tenant_id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao salvar no Supabase', error);
      // Cleanup da OpenAI em caso de erro
      try {
        await fetch(`https://api.openai.com/v1/assistants/${openaiAssistant.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        });
      } catch (cleanupError) {
        logger.error('Erro ao fazer cleanup da OpenAI', cleanupError);
      }
      throw new Error(`Erro ao salvar assistente: ${error.message}`);
    }

    logger.info('Assistente salvo com sucesso', data.id);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    logger.error('Erro em handleCreateAssistant', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleUpdateAssistant(req: Request, assistantDbId: string) {
  try {
    logger.info('=== INICIANDO ATUALIZAÇÃO ===');
    logger.debug('Assistant DB ID', assistantDbId);

    const requestBody = await req.json();
    logger.debug('Dados recebidos', requestBody);
    
    const { name, model, instructions } = requestBody;

    // Buscar assistente no banco
    logger.debug('Buscando assistente no banco...');
    const { data: assistantData, error: fetchError } = await supabase
      .from('assistants')
      .select('assistant_id')
      .eq('id', assistantDbId)
      .single();

    logger.debug('Resultado da busca', { assistantData, fetchError });

    if (fetchError) {
      logger.error('Erro ao buscar assistente', fetchError);
      throw new Error(`Erro ao buscar assistente: ${fetchError.message}`);
    }

    if (!assistantData) {
      logger.error('Assistente não encontrado');
      throw new Error('Assistente não encontrado');
    }

    logger.info('Assistente encontrado, OpenAI ID', assistantData.assistant_id);

    // Atualizar na OpenAI
    logger.debug('Atualizando na OpenAI...');
    const openaiResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantData.assistant_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        name,
        model,
        instructions,
      }),
    });

    logger.debug('OpenAI Response status', openaiResponse.status);

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      logger.error('Erro OpenAI', error);
      throw new Error(`Erro ao atualizar assistente na OpenAI: ${error}`);
    }

    // Atualizar no Supabase
    logger.debug('Atualizando no Supabase...');
    const { data, error } = await supabase
      .from('assistants')
      .update({
        name,
        model,
        instructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assistantDbId)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar no Supabase', error);
      throw new Error(`Erro ao atualizar assistente: ${error.message}`);
    }

    logger.info('Assistente atualizado com sucesso');
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    logger.error('Erro em handleUpdateAssistant', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleDeleteAssistant(assistantDbId: string) {
  try {
    logger.info('=== INICIANDO DELEÇÃO ===');
    logger.debug('Assistant DB ID', assistantDbId);

    // Buscar assistente no banco
    logger.debug('Buscando assistente no banco...');
    const { data: assistantData, error: fetchError } = await supabase
      .from('assistants')
      .select('assistant_id')
      .eq('id', assistantDbId)
      .single();

    logger.debug('Resultado da busca', { assistantData, fetchError });

    if (fetchError) {
      logger.error('Erro ao buscar assistente', fetchError);
      throw new Error(`Erro ao buscar assistente: ${fetchError.message}`);
    }

    if (!assistantData) {
      logger.error('Assistente não encontrado');
      throw new Error('Assistente não encontrado');
    }

    logger.info('Assistente encontrado, OpenAI ID', assistantData.assistant_id);

    // Deletar da OpenAI (não crítico se falhar)
    logger.debug('Deletando da OpenAI...');
    try {
      const openaiResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantData.assistant_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });
      logger.debug('OpenAI Delete Response status', openaiResponse.status);
    } catch (error: unknown) {
      logger.error('Erro ao deletar da OpenAI (continuando)', error);
    }

    // Deletar do Supabase
    logger.debug('Deletando do Supabase...');
    const { error } = await supabase
      .from('assistants')
      .delete()
      .eq('id', assistantDbId);

    if (error) {
      logger.error('Erro ao deletar do Supabase', error);
      throw new Error(`Erro ao deletar assistente: ${error.message}`);
    }

    logger.info('Assistente deletado com sucesso');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    logger.error('Erro em handleDeleteAssistant', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}