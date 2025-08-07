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
          <div key={index} className="font-mono text-sm bg-muted/50 p-2 rounded my-1">
            {line}
          </div>
        );
      }
      
      // Títulos e seções
      if (line.startsWith('##') || line.startsWith('**')) {
        return (
          <div key={index} className="font-semibold text-brand-primary mt-3 mb-1">
            {line.replace(/[#*]/g, '')}
          </div>
        );
      }
      
      return <div key={index}>{line}</div>;
    });
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand-primary" />
          <h3 className="font-semibold">Estrategista de Anúncios - {marketplace}</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetChat}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reiniciar
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium text-lg mb-2">Modo Estratégico</h4>
            <p className="text-muted-foreground mb-4">
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
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-brand-background" />
                </div>
              </div>
            )}
            
            <Card className={`max-w-[80%] ${msg.role === 'user' ? 'bg-brand-primary text-brand-background' : ''}`}>
              <CardContent className="p-3">
                <div className="text-sm whitespace-pre-wrap">
                  {formatMessage(msg.content)}
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>

            {msg.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-brand-background" />
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
              className="flex-1 min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              size="sm"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}