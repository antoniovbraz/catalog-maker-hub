import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { generateAdChatSchema } from '../shared/schemas.ts';
import { setupLogger } from '../shared/logger.ts';
import { corsHeaders, handleCors } from '../shared/cors.ts';
import { checkEnv } from '../../../edges/_shared/checkEnv.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  checkEnv();

  setupLogger(req.headers);
  try {
    const {
      thread_id,
      message,
      product_info,
      marketplace,
      is_initial_message = false,
    } = generateAdChatSchema.parse(await req.json());

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processando chat para marketplace:', marketplace);

    // Buscar assistente para o marketplace
    const { data: assistant } = await supabase
      .from('assistants')
      .select('assistant_id, instructions')
      .eq('marketplace', marketplace)
      .single();

    if (!assistant?.assistant_id) {
      throw new Error(`Assistente não encontrado para marketplace: ${marketplace}`);
    }

    console.log('Assistente encontrado:', assistant.assistant_id);

    let currentThreadId = thread_id;

    // Criar nova thread se for a primeira mensagem
    if (!currentThreadId) {
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });

      const threadData = await threadResponse.json();
      currentThreadId = threadData.id;
      console.log('Nova thread criada:', currentThreadId);
    }

    // Preparar mensagem baseada no contexto
    let messageContent = message;
    
    if (is_initial_message && product_info) {
      messageContent = `BRIEFING DO PRODUTO:

Produto: ${product_info.name}
SKU: ${product_info.sku || 'N/A'}
Categoria: ${product_info.category || 'N/A'}
Custo: R$ ${product_info.cost_unit || 0}
Embalagem: R$ ${product_info.packaging_cost || 0}
Descrição: ${product_info.description || 'Não informada'}

MARKETPLACE: ${marketplace.toUpperCase()}

SOLICITAÇÃO: ${message}

Agora inicie o processo estratégico conforme suas instruções. Faça o diagnóstico comercial e conduza a conversa para criar o anúncio perfeito.`;
    }

    // Adicionar mensagem à thread
    await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: messageContent
      })
    });

    console.log('Mensagem adicionada à thread');

    // Criar e executar run
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistant.assistant_id
      })
    });

    const runData = await runResponse.json();
    console.log('Run criado:', runData.id);

    // Aguardar conclusão do run
    let run = runData;
    while (run.status === 'queued' || run.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const runStatusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      run = await runStatusResponse.json();
      console.log('Status do run:', run.status);
    }

    if (run.status !== 'completed') {
      throw new Error(`Run falhou com status: ${run.status}`);
    }

    // Buscar mensagens da thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messagesData = await messagesResponse.json();

    // Pegar a resposta mais recente do assistente
    interface ThreadMessage {
      role: string;
      content: Array<{ text?: { value: string } }>; // structure from OpenAI thread response
    }

    const assistantMessage = messagesData.data.find(
      (msg: ThreadMessage) => msg.role === 'assistant'
    ) as ThreadMessage | undefined;

    const responseText = assistantMessage?.content[0]?.text?.value || 'Erro ao obter resposta';

    console.log('Resposta do assistente obtida');

    return new Response(JSON.stringify({
      thread_id: currentThreadId,
      response: responseText,
      status: 'completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no chat:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});