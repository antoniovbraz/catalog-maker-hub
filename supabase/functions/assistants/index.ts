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
    
    // Validar configurações
    if (!OPENAI_API_KEY) {
      console.error('ERRO: OpenAI API key não está configurada');
      return new Response(JSON.stringify({ error: 'OpenAI API key não está configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('ERRO: Supabase env vars não configuradas');
      return new Response(JSON.stringify({ error: 'Supabase não está configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { method } = req;
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    console.log('Path segments:', pathSegments);

    if (method === 'POST') {
      console.log('Roteando para createAssistant');
      return createAssistant(req);
    } else if (method === 'PUT' && pathSegments.length >= 2) {
      const assistantDbId = pathSegments[pathSegments.length - 1];
      console.log('Roteando para updateAssistant, ID:', assistantDbId);
      return updateAssistant(req, assistantDbId);
    } else if (method === 'DELETE' && pathSegments.length >= 2) {
      const assistantDbId = pathSegments[pathSegments.length - 1];
      console.log('Roteando para deleteAssistant, ID:', assistantDbId);
      return deleteAssistant(assistantDbId);
    } else {
      console.error('Rota não encontrada:', { method, pathSegments });
      return new Response(JSON.stringify({ 
        error: 'Método não suportado ou rota inválida',
        method,
        pathSegments 
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Erro na edge function assistants:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
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

  // Atualizar na OpenAI com timeout e retry
  console.log('Chamando OpenAI API para atualizar assistente...');
  let openaiResponse;
  try {
    openaiResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantData.assistant_id}`, {
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
  } catch (error: any) {
    console.error('Erro na comunicação com OpenAI:', error);
    throw new Error(`Erro de conectividade com OpenAI: ${error.message}`);
  }

  if (!openaiResponse.ok) {
    const error = await openaiResponse.text();
    console.error('Erro OpenAI:', error);
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

  // Deletar da OpenAI com timeout e retry
  console.log('Chamando OpenAI API para deletar assistente...');
  try {
    const openaiResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantData.assistant_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });
    console.log('OpenAI Delete Response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('Erro ao deletar assistente da OpenAI:', error);
      // Continuar mesmo se falhar na OpenAI
    }
  } catch (error: any) {
    console.error('Erro na comunicação com OpenAI durante deleção:', error);
    // Continuar mesmo se falhar na OpenAI
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