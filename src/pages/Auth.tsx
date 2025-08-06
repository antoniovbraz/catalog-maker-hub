import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Zap } from '@/components/ui/icons';
import { Heading, Text } from "@/components/ui/typography";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  companyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      companyName: '',
    },
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.fullName);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      <div className="mx-4 w-full max-w-md">
        {/* Logo and Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Zap className="size-8 text-primary" />
          </div>
            <Heading
              variant="h1"
              className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text"
              style={{ color: 'transparent' }}
            >
              Peepers Hub
            </Heading>
          <Text variant="muted" className="mt-2">
            Ferramentas inteligentes para marketplaces
          </Text>
        </div>

        <Card className="border-0 bg-card/50 shadow-form backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
            <CardDescription>
              Acesse sua conta ou crie uma nova para começar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login" className="space-y-md">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-md">
                  <div className="space-y-sm">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      {...loginForm.register('email')}
                      className={loginForm.formState.errors.email ? 'border-destructive' : ''}
                    />
                    {loginForm.formState.errors.email && (
                      <Text variant="caption" className="text-destructive">
                        {loginForm.formState.errors.email.message}
                      </Text>
                    )}
                  </div>

                  <div className="space-y-sm">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sua senha"
                        {...loginForm.register('password')}
                        className={loginForm.formState.errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <Eye className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <Text variant="caption" className="text-destructive">
                        {loginForm.formState.errors.password.message}
                      </Text>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="space-y-md">
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-md">
                  <div className="space-y-sm">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      {...signUpForm.register('fullName')}
                      className={signUpForm.formState.errors.fullName ? 'border-destructive' : ''}
                    />
                    {signUpForm.formState.errors.fullName && (
                      <Text variant="caption" className="text-destructive">
                        {signUpForm.formState.errors.fullName.message}
                      </Text>
                    )}
                  </div>

                  <div className="space-y-sm">
                    <Label htmlFor="signup-company">Empresa (Opcional)</Label>
                    <Input
                      id="signup-company"
                      type="text"
                      placeholder="Nome da sua empresa"
                      {...signUpForm.register('companyName')}
                    />
                  </div>

                  <div className="space-y-sm">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      {...signUpForm.register('email')}
                      className={signUpForm.formState.errors.email ? 'border-destructive' : ''}
                    />
                    {signUpForm.formState.errors.email && (
                      <Text variant="caption" className="text-destructive">
                        {signUpForm.formState.errors.email.message}
                      </Text>
                    )}
                  </div>

                  <div className="space-y-sm">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sua senha"
                        {...signUpForm.register('password')}
                        className={signUpForm.formState.errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <Eye className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.password && (
                      <Text variant="caption" className="text-destructive">
                        {signUpForm.formState.errors.password.message}
                      </Text>
                    )}
                  </div>

                  <div className="space-y-sm">
                    <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirme sua senha"
                      {...signUpForm.register('confirmPassword')}
                      className={signUpForm.formState.errors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {signUpForm.formState.errors.confirmPassword && (
                      <Text variant="caption" className="text-destructive">
                        {signUpForm.formState.errors.confirmPassword.message}
                      </Text>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Text variant="caption" className="mt-6 text-center text-muted-foreground">
          © 2024 Peepers Hub. Todos os direitos reservados.
        </Text>
      </div>
    </div>
  );
}