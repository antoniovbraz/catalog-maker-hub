import { useEffect, useState, type ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { authService } from '@/services/auth'
import { toast } from '@/hooks/use-toast'
import { useLogger } from '@/utils/logger'
import type { AuthContextType, Profile } from '@/types/auth'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const logger = useLogger('AuthContext')

  useEffect(() => {
    let isMounted = true

    // CORREÇÃO: Timeout de segurança mais agressivo - apenas 1 segundo
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        logger.debug('Safety timeout triggered - forcing loading false')
        setLoading(false)
      }
    }, 1000) // CRÍTICO: Apenas 1 segundo para forçar saída do loading

    const fetchProfile = async (userId: string) => {
      try {
        logger.debug('Fetching profile for user', { userId })
        
        // CORREÇÃO CRÍTICA: Simplificar busca de perfil sem timeouts que causam problemas
        const profileData = await authService.getCurrentProfile();
        
        logger.debug('Profile fetch result', { 
          hasProfile: !!profileData, 
          profileData: profileData ? { id: profileData.id, role: profileData.role } : null 
        })
        
        if (isMounted) {
          logger.debug('Setting profile and loading false', { hasProfile: !!profileData })
          setProfile(profileData)
          setLoading(false)
          clearTimeout(safetyTimeout)
        }
      } catch (error) {
        logger.error('Error fetching profile', error)
        if (isMounted) {
          // IMPORTANTE: Não mostrar toast de erro aqui para evitar spam
          // Se der erro, vamos continuar sem perfil mas não ficar infinito
          setProfile(null)
          setLoading(false)
          clearTimeout(safetyTimeout)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return

        logger.debug('Auth state change', { event, hasUser: !!session?.user })

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // CORREÇÃO: Não bloquear o auth state change com fetchProfile
          fetchProfile(session.user.id).catch(err => {
            logger.error('Profile fetch failed in auth change', err)
            setLoading(false)
            clearTimeout(safetyTimeout)
          })
        } else {
          setProfile(null)
          setLoading(false)
          clearTimeout(safetyTimeout)
        }
      }
    )

    const initializeAuth = async () => {
      try {
        logger.debug('Initializing auth...')
        
        // CORREÇÃO CRÍTICA: Usar getSession sem await excessivo
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!isMounted) return

        logger.debug('Initial session', { 
          hasUser: !!session?.user,
          error: error?.message,
          userId: session?.user?.id 
        })
        
        if (error) {
          logger.error('Error getting session', error)
          setLoading(false)
          clearTimeout(safetyTimeout)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // IMPORTANTE: Não usar await aqui para evitar bloquear a inicialização
          fetchProfile(session.user.id).catch(err => {
            logger.error('Profile fetch failed during init', err)
            setLoading(false)
            clearTimeout(safetyTimeout)
          })
        } else {
          logger.debug('No user session, setting loading false')
          setLoading(false)
          clearTimeout(safetyTimeout)
        }
      } catch (error) {
        logger.error('Error initializing auth', error)
        if (isMounted) {
          setLoading(false)
          clearTimeout(safetyTimeout)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // CORREÇÃO CRÍTICA: Remover [logger] para evitar loop infinito

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await authService.signIn(email, password)
      if (error) {
        toast({
          title: 'Erro no login',
          description: error.message,
          variant: 'destructive'
        })
        return { error }
      }

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo ao Peepers Hub'
      })

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive'
      })
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await authService.signUp(email, password, fullName)
      if (error) {
        toast({
          title: 'Erro no cadastro',
          description: error.message,
          variant: 'destructive'
        })
        return { error }
      }

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Verifique seu email para confirmar a conta.'
      })

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro no cadastro',
        description: errorMessage,
        variant: 'destructive'
      })
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)

      toast({
        title: 'Logout realizado',
        description: 'Até logo!'
      })
    } catch (error) {
      logger.error('Error signing out', error)
      toast({
        title: 'Erro no logout',
        description: 'Tente novamente',
        variant: 'destructive'
      })
    }
  }

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Usuário não autenticado') }

    try {
      const updated = await authService.updateProfile(user.id, data)
      setProfile(updated)

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas.'
      })

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao atualizar perfil',
        description: errorMessage,
        variant: 'destructive'
      })
      return { error: error as Error }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
