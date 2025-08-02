import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { Profile } from "@/types/auth";
import { logger } from "@/utils/logger";

export class AuthService extends BaseService<Profile> {
  constructor() {
    super('profiles');
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signUp(email: string, password: string, fullName?: string) {
    const redirectUrl = `${import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        }
      }
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Error fetching profile', 'AuthService', error);
      return null;
    }

    return data;
  }

  async updateProfile(userId: string, data: Partial<Profile>) {
    const { data: result, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar perfil: ${error.message}`);
    return result;
  }

  async getCurrentUserRole(): Promise<'super_admin' | 'admin' | 'user' | null> {
    const profile = await this.getCurrentProfile();
    return profile?.role || null;
  }

  async getCurrentTenantId(): Promise<string | null> {
    const profile = await this.getCurrentProfile();
    return profile?.tenant_id || null;
  }
}

export const authService = new AuthService();
