import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { supabase } from '@/constants/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: AuthError | null }>;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          
          // Handle invalid refresh token error
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found')) {
            console.log('Invalid refresh token detected, clearing session...');
            await supabase.auth.signOut();
          }
        }
        
        console.log('Initial session:', session?.user?.email || 'No session');
        
        if (isMounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (isMounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No session');
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed, clearing session...');
          await supabase.auth.signOut();
        }
        
        if (isMounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            initialized: true,
          });
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log('🔄 Starting signup process for:', email);
    
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('📡 Making signup request to Supabase...');
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation redirect
        }
      });
      
      console.log('✅ Signup response received');
      console.log('👤 User:', data.user ? `${data.user.id} (${data.user.email})` : 'None');
      console.log('🎫 Session:', data.session ? 'Created' : 'None');
      console.log('📧 Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
      console.log('❌ Error:', error ? `${error.message} (${error.status})` : 'None');
      
      setAuthState(prev => ({ ...prev, loading: false }));
      
      if (error) {
        console.error('❌ Signup failed:', error.message);
        
        // Handle specific error cases with user-friendly messages
        let userMessage = error.message;
        
        if (error.message?.includes('User already registered')) {
          userMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message?.includes('Invalid login credentials')) {
          userMessage = 'Invalid email format. Please check your email address.';
        } else if (error.message?.includes('signup is disabled')) {
          userMessage = 'Account creation is currently disabled. Please contact support.';
        } else if (error.message?.includes('Unable to validate email address')) {
          userMessage = 'Please enter a valid email address.';
        } else if (error.message?.includes('Password should be at least')) {
          userMessage = 'Password must be at least 6 characters long.';
        }
        
        return { error: { ...error, message: userMessage } };
      }
      
      console.log('🎉 Signup successful!');
      return { error: null };
      
    } catch (networkError: any) {
      console.error('🌐 Network error during signup:', networkError);
      
      setAuthState(prev => ({ ...prev, loading: false }));
      
      let errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      
      if (networkError.message?.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet and try again.';
      } else if (networkError.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      return { 
        error: { 
          message: errorMessage,
          status: 0,
          name: 'NetworkError'
        } as any
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      setAuthState(prev => ({ ...prev, loading: false }));
      
      if (error) {
        console.error('Sign in error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
      } else {
        console.log('Sign in successful');
      }
      
      return { error };
    } catch (networkError) {
      console.error('Network error during signin:', networkError);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { 
        error: { 
          message: 'Network error. Please check your internet connection and try again.',
          status: 0,
          name: 'NetworkError'
        } as any
      };
    }
  };

  const signOut = async () => {
    console.log('Signing out user');
    setAuthState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signOut();
    
    setAuthState(prev => ({ ...prev, loading: false }));
    
    if (error) {
      console.error('Sign out error:', error);
    } else {
      console.log('Sign out successful');
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    console.log('Resetting password for:', email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      console.error('Reset password error:', error);
    } else {
      console.log('Reset password email sent');
    }
    
    return { error };
  };

  const updateEmail = async (newEmail: string) => {
    console.log('Updating email to:', newEmail);
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase(),
      });
      
      if (error) {
        console.error('Update email error:', error);
        
        let userMessage = error.message;
        
        if (error.message?.includes('Email rate limit exceeded')) {
          userMessage = 'Too many email change requests. Please try again later.';
        } else if (error.message?.includes('Unable to validate email address')) {
          userMessage = 'Please enter a valid email address.';
        } else if (error.message?.includes('Email already exists')) {
          userMessage = 'This email is already in use by another account.';
        }
        
        return { error: { ...error, message: userMessage } };
      }
      
      console.log('Email update initiated. Confirmation email sent.');
      return { error: null };
      
    } catch (networkError: any) {
      console.error('Network error during email update:', networkError);
      
      return { 
        error: { 
          message: 'Network error. Please check your internet connection and try again.',
          status: 0,
          name: 'NetworkError'
        } as any
      };
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateEmail,
  } as AuthState & AuthActions;
});