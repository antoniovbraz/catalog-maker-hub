import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateAdRequest {
  assistant_id: string;
  product_info: string;
  marketplace: string;
  image_urls: string[];
  custom_prompt?: string;
  description_only?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { assistant_id, product_info, marketplace, image_urls, custom_prompt, description_only }: GenerateAdRequest = await req.json();

    console.log('Iniciando geração de anúncio', { assistant_id, marketplace, description_only });

    // Criar thread no OpenAI
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        messages: []
      }),
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.text();
      console.error('Erro ao criar thread:', error);
      throw new Error(`Erro ao criar thread: ${error}`);
    }

    const thread = await threadResponse.json();
    console.log('Thread criada:', thread.id);

    // Preparar prompt baseado no tipo de geração
    let prompt = `${product_info}\n\n`;
    
    if (description_only) {
      prompt += `Por favor, gere apenas uma descrição detalhada e atrativa para este produto no marketplace ${marketplace}.`;
    } else {
      prompt += `Por favor, gere um anúncio completo para este produto no marketplace ${marketplace}, incluindo:
1. Título atrativo (máximo 60 caracteres)
2. Descrição detalhada
3. Palavras-chave relevantes`;
    }

    if (custom_prompt) {
      prompt += `\n\nInstruções adicionais: ${custom_prompt}`;
    }

    if (image_urls.length > 0) {
      prompt += `\n\nO produto possui ${image_urls.length} imagem(ns) disponível(is).`;
    }

    // Adicionar mensagem à thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: prompt,
      }),
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.text();
      console.error('Erro ao adicionar mensagem:', error);
      throw new Error(`Erro ao adicionar mensagem: ${error}`);
    }

    console.log('Mensagem adicionada à thread');

    // Executar assistente
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistant_id,
      }),
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      console.error('Erro ao executar assistente:', error);
      throw new Error(`Erro ao executar assistente: ${error}`);
    }

    const run = await runResponse.json();
    console.log('Execução iniciada:', run.id);

    // Aguardar conclusão da execução
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos de timeout

    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      if (attempts >= maxAttempts) {
        throw new Error('Timeout na execução do assistente');
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (!statusResponse.ok) {
        throw new Error('Erro ao verificar status da execução');
      }

      runStatus = await statusResponse.json();
      attempts++;
      console.log(`Status da execução (tentativa ${attempts}):`, runStatus.status);
    }

    if (runStatus.status !== 'completed') {
      console.error('Execução não concluída:', runStatus);
      throw new Error(`Execução falhou com status: ${runStatus.status}`);
    }

    // Buscar mensagens da thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      throw new Error('Erro ao buscar mensagens');
    }

    const messages = await messagesResponse.json();
    interface ThreadMessage {
      role: string;
      content: Array<{ text?: { value: string } }>;
    }

    const assistantMessage = messages.data.find(
      (msg: ThreadMessage) => msg.role === 'assistant'
    ) as ThreadMessage | undefined;

    if (!assistantMessage || !assistantMessage.content[0]) {
      throw new Error('Nenhuma resposta do assistente encontrada');
    }

    const generatedContent = assistantMessage.content[0].text.value;
    console.log('Conteúdo gerado:', generatedContent.substring(0, 200) + '...');

    // Processar resposta baseado no tipo
    let result;
    if (description_only) {
      result = {
        description: generatedContent.trim(),
      };
    } else {
      // Tentar extrair título, descrição e palavras-chave do conteúdo gerado
      const lines = generatedContent.split('\n').filter(line => line.trim());
      
      let title = '';
      let description = '';
      let keywords: string[] = [];

      // Procurar por padrões comuns de formatação
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        if (line.includes('título') || line.includes('title')) {
          title = lines[i + 1]?.trim() || lines[i].split(':')[1]?.trim() || '';
        } else if (line.includes('descrição') || line.includes('description')) {
          description = lines[i + 1]?.trim() || lines[i].split(':')[1]?.trim() || '';
        } else if (line.includes('palavras-chave') || line.includes('keywords')) {
          const keywordLine = lines[i + 1]?.trim() || lines[i].split(':')[1]?.trim() || '';
          keywords = keywordLine.split(',').map(k => k.trim()).filter(k => k);
        }
      }

      // Se não conseguiu extrair estruturalmente, usar o conteúdo como descrição
      if (!title && !description) {
        description = generatedContent.trim();
        title = description.split('\n')[0]?.substring(0, 60) || 'Produto';
      }

      result = {
        title: title || 'Produto',
        description: description || generatedContent.trim(),
        keywords: keywords.length > 0 ? keywords : [marketplace, 'produto'],
      };
    }

    console.log('Resultado processado:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na generate-ad function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Verifique os logs da função para mais detalhes'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});