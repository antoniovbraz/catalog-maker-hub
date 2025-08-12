import { useEffect, useState, type ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { authService } from '@/services/auth'
import { toast } from '@/components/ui/use-toast'
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

    const fetchProfile = async (userId: string) => {
      try {
        logger.debug('Fetching profile for user', { userId })
        const profileData = await authService.getCurrentProfile()
        if (isMounted) {
          logger.debug('Profile fetched', { hasProfile: !!profileData })
          setProfile(profileData)
          setLoading(false)
        }
      } catch (error) {
        logger.error('Error fetching profile', error)
        if (isMounted) {
          setProfile(null)
          setLoading(false)
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
          setTimeout(() => {
            if (isMounted) {
              fetchProfile(session.user.id)
            }
          }, 0)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    const initializeAuth = async () => {
      try {
        logger.debug('Initializing auth...')
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return

        logger.debug('Initial session', { hasUser: !!session?.user })
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        logger.error('Error initializing auth', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [logger])

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
