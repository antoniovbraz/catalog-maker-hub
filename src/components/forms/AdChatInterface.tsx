import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Bot, User, RotateCcw } from '@/components/ui/icons';
import { useAdChat } from '@/hooks/useAdChat';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface AdChatInterfaceProps {
  productData: unknown;
  marketplace: string;
  onResultGenerated?: (result: unknown) => void;
}

export function AdChatInterface({ 
  productData, 
  marketplace, 
  onResultGenerated 
}: AdChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const { messages, sendMessage, resetChat, isLoading } = useAdChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || isLoading) return;
    
    sendMessage(message, productData, marketplace);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startChat = () => {
    const initialMessage = "Quero criar um anúncio estratégico para este produto. Faça o diagnóstico comercial e me guie no processo.";
    sendMessage(initialMessage, productData, marketplace);
  };

  const formatMessage = (content: string) => {
    // Detectar se é resultado final do anúncio
    if (content.includes('TÍTULO:') || content.includes('DESCRIÇÃO:')) {
      onResultGenerated?.(content);
    }

    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // Formatação de tabelas simples
      if (line.includes('|')) {
        return (
          <div key={index} className="my-1 rounded bg-muted/50 p-2 font-mono text-sm">
            {line}
          </div>
        );
      }
      
      // Títulos e seções
      if (line.startsWith('##') || line.startsWith('**')) {
        return (
          <div key={index} className="mb-1 mt-3 font-semibold text-primary">
            {line.replace(/[#*]/g, '')}
          </div>
        );
      }
      
      return <div key={index}>{line}</div>;
    });
  };

  return (
    <div className="mx-auto flex h-[600px] max-w-4xl flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          <h3 className="font-semibold">Estrategista de Anúncios - {marketplace}</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetChat}
          disabled={isLoading}
        >
          <RotateCcw className="mr-2 size-4" />
          Reiniciar
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <Bot className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h4 className="mb-2 text-lg font-medium">Modo Estratégico</h4>
            <p className="mb-4 text-muted-foreground">
              O assistente irá fazer um diagnóstico completo e criar anúncios otimizados através de uma conversa estratégica.
            </p>
            <Button onClick={startChat} disabled={isLoading}>
              Iniciar Diagnóstico Estratégico
            </Button>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="shrink-0">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                  <Bot className="size-4 text-primary-foreground" />
                </div>
              </div>
            )}
            
            <Card className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
              <CardContent className="p-3">
                <div className="whitespace-pre-wrap text-sm">
                  {formatMessage(msg.content)}
                </div>
                <div className="mt-2 text-xs opacity-70">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>

            {msg.role === 'user' && (
              <div className="shrink-0">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                  <User className="size-4" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                <Bot className="size-4 text-primary-foreground" />
              </div>
            </div>
            <Card>
              <CardContent className="p-3">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Analisando e preparando resposta...
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {messages.length > 0 && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua resposta..."
              className="min-h-[60px] flex-1 resize-none"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              size="sm"
              className="self-end"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}