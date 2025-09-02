import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { assistantCreateSchema, assistantUpdateSchema } from '../shared/schemas.ts';
import { setupLogger } from '../shared/logger.ts';

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
  setupLogger(req.headers);
  console.log(`=== ASSISTANTS ${req.method} REQUEST ===`);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Validar configurações essenciais
    if (!OPENAI_API_KEY) {
      console.error('ERRO: OpenAI API key não configurada');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key não está configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    console.log('Path parts:', pathParts);
    
    // Extrair o ID do assistente da URL se presente
    const assistantId = pathParts[pathParts.length - 1];
    console.log('Assistant ID extraído:', assistantId);

    // Roteamento baseado no método HTTP
    switch (req.method) {
      case 'POST':
        console.log('Roteando para CREATE');
        return await handleCreateAssistant(req);
        
      case 'PUT':
        console.log('Roteando para UPDATE com ID:', assistantId);
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
        console.log('Roteando para DELETE com ID:', assistantId);
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
        console.error('Método não suportado:', req.method);
        return new Response(JSON.stringify({ 
          error: `Método ${req.method} não suportado` 
        }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('ERRO GERAL na edge function:', error);
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
    console.log('=== INICIANDO CRIAÇÃO ===');
    const { name, marketplace, model, instructions, tenant_id } =
      assistantCreateSchema.parse(await req.json());
    console.log('Dados recebidos:', { name, marketplace, model, tenant_id });

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
      console.error('Erro da OpenAI:', error);
      throw new Error(`Erro ao criar assistente na OpenAI: ${error}`);
    }

    const openaiAssistant = await openaiResponse.json();
    console.log('Assistente criado na OpenAI:', openaiAssistant.id);

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
      console.error('Erro ao salvar no Supabase:', error);
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
        console.error('Erro ao fazer cleanup da OpenAI:', cleanupError);
      }
      throw new Error(`Erro ao salvar assistente: ${error.message}`);
    }

    console.log('Assistente salvo com sucesso:', data.id);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Erro em handleCreateAssistant:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleUpdateAssistant(req: Request, assistantDbId: string) {
  try {
    console.log('=== INICIANDO ATUALIZAÇÃO ===');
    console.log('Assistant DB ID:', assistantDbId);
    
    const requestBody = assistantUpdateSchema.parse(await req.json());
    console.log('Dados recebidos:', requestBody);

    const { name, model, instructions } = requestBody;

    // Buscar assistente no banco
    console.log('Buscando assistente no banco...');
    const { data: assistantData, error: fetchError } = await supabase
      .from('assistants')
      .select('assistant_id')
      .eq('id', assistantDbId)
      .single();

    console.log('Resultado da busca:', { assistantData, fetchError });

    if (fetchError) {
      console.error('Erro ao buscar assistente:', fetchError);
      throw new Error(`Erro ao buscar assistente: ${fetchError.message}`);
    }

    if (!assistantData) {
      console.error('Assistente não encontrado');
      throw new Error('Assistente não encontrado');
    }

    console.log('Assistente encontrado, OpenAI ID:', assistantData.assistant_id);

    // Atualizar na OpenAI
    console.log('Atualizando na OpenAI...');
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

    console.log('OpenAI Response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('Erro OpenAI:', error);
      throw new Error(`Erro ao atualizar assistente na OpenAI: ${error}`);
    }

    // Atualizar no Supabase
    console.log('Atualizando no Supabase...');
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
      console.error('Erro ao atualizar no Supabase:', error);
      throw new Error(`Erro ao atualizar assistente: ${error.message}`);
    }

    console.log('Assistente atualizado com sucesso');
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Erro em handleUpdateAssistant:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleDeleteAssistant(assistantDbId: string) {
  try {
    console.log('=== INICIANDO DELEÇÃO ===');
    console.log('Assistant DB ID:', assistantDbId);

    // Buscar assistente no banco
    console.log('Buscando assistente no banco...');
    const { data: assistantData, error: fetchError } = await supabase
      .from('assistants')
      .select('assistant_id')
      .eq('id', assistantDbId)
      .single();

    console.log('Resultado da busca:', { assistantData, fetchError });

    if (fetchError) {
      console.error('Erro ao buscar assistente:', fetchError);
      throw new Error(`Erro ao buscar assistente: ${fetchError.message}`);
    }

    if (!assistantData) {
      console.error('Assistente não encontrado');
      throw new Error('Assistente não encontrado');
    }

    console.log('Assistente encontrado, OpenAI ID:', assistantData.assistant_id);

    // Deletar da OpenAI (não crítico se falhar)
    console.log('Deletando da OpenAI...');
    try {
      const openaiResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantData.assistant_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });
      console.log('OpenAI Delete Response status:', openaiResponse.status);
    } catch (error: unknown) {
      console.error('Erro ao deletar da OpenAI (continuando):', error);
    }

    // Deletar do Supabase
    console.log('Deletando do Supabase...');
    const { error } = await supabase
      .from('assistants')
      .delete()
      .eq('id', assistantDbId);

    if (error) {
      console.error('Erro ao deletar do Supabase:', error);
      throw new Error(`Erro ao deletar assistente: ${error.message}`);
    }

    console.log('Assistente deletado com sucesso');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Erro em handleDeleteAssistant:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}