import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface Profile {
  id: string;
  user_id: string;
  gemini_api_key: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  geminiApiKey: string | null;
  hasApiKey: boolean;
  updateGeminiApiKey: (apiKey: string) => Promise<{ error: Error | null }>;
  clearGeminiApiKey: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Profile might not exist yet (for existing users before migration)
        if (error.code === 'PGRST116') {
          // Create profile for existing user
          const { data: newProfile, error: insertError } = await (supabase as any)
            .from('profiles')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (!insertError && newProfile) {
            setProfile(newProfile);
          }
        } else {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateGeminiApiKey = async (apiKey: string): Promise<{ error: Error | null }> => {
    if (!user || !profile) {
      return { error: new Error('No user or profile found') };
    }

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ gemini_api_key: apiKey.trim() || null })
        .eq('user_id', user.id);

      if (error) {
        return { error: new Error(error.message) };
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, gemini_api_key: apiKey.trim() || null } : null);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to update API key') };
    }
  };

  const clearGeminiApiKey = async (): Promise<{ error: Error | null }> => {
    return updateGeminiApiKey('');
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        geminiApiKey: profile?.gemini_api_key || null,
        hasApiKey: Boolean(profile?.gemini_api_key),
        updateGeminiApiKey,
        clearGeminiApiKey,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};