import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== ASSISTANTS EDGE FUNCTION INICIADA ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    if (!OPENAI_API_KEY) {
      console.error('ERRO: OpenAI API key não está configurada');
      throw new Error('OpenAI API key não está configurada');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('ERRO: Supabase env vars não configuradas');
      throw new Error('Supabase não está configurado');
    }

    const { method } = req;
    const url = new URL(req.url);
    const assistantId = url.pathname.split('/').pop();

    console.log(`Processando ${method} para assistente ${assistantId}`);

    switch (method) {
      case 'POST':
        return await createAssistant(req);
      case 'PUT':
        return await updateAssistant(req, assistantId!);
      case 'DELETE':
        return await deleteAssistant(assistantId!);
      default:
        return new Response(JSON.stringify({ error: 'Método não permitido' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Erro na função assistants:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createAssistant(req: Request) {
  const { name, marketplace, model, instructions, tenant_id } = await req.json();

  console.log('Criando assistente OpenAI:', { name, marketplace, model });

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
    // Tentar remover assistente da OpenAI em caso de erro
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
}

async function updateAssistant(req: Request, assistantDbId: string) {
  const { name, model, instructions } = await req.json();

  console.log('=== INICIANDO ATUALIZAÇÃO ===');
  console.log('Assistant DB ID:', assistantDbId);
  console.log('Dados recebidos:', { name, model, instructions: instructions?.substring(0, 100) + '...' });

  // Buscar assistente no banco
  console.log('Buscando assistente na tabela assistants...');
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
    console.error('Assistente não encontrado no banco');
    throw new Error('Assistente não encontrado');
  }

  console.log('Assistente encontrado, OpenAI ID:', assistantData.assistant_id);

  // Atualizar na OpenAI
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

  if (!openaiResponse.ok) {
    const error = await openaiResponse.text();
    console.error('Erro da OpenAI na atualização:', error);
    throw new Error(`Erro ao atualizar assistente na OpenAI: ${error}`);
  }

  // Atualizar no Supabase
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
}

async function deleteAssistant(assistantDbId: string) {
  console.log('=== INICIANDO DELEÇÃO ===');
  console.log('Assistant DB ID:', assistantDbId);

  // Buscar assistente no banco
  console.log('Buscando assistente na tabela assistants...');
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
    console.error('Assistente não encontrado no banco');
    throw new Error('Assistente não encontrado');
  }

  console.log('Assistente encontrado, OpenAI ID:', assistantData.assistant_id);

  // Deletar da OpenAI
  const openaiResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantData.assistant_id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });

  if (!openaiResponse.ok) {
    const error = await openaiResponse.text();
    console.error('Erro da OpenAI na deleção:', error);
    // Continuar mesmo com erro da OpenAI
  }

  // Deletar do Supabase
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
}