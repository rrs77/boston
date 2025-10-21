import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { wordpressAPI } from '../config/api';
import { supabase } from '../config/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  token?: string;
}

// Helper function to set Supabase user context for RLS
async function setSupabaseUserContext(userId: string) {
  try {
    // Set the user context in Supabase for Row Level Security
    await supabase.rpc('set_user_context', { p_user_id: userId });
    console.log('✅ Supabase user context set:', userId);
  } catch (error) {
    console.warn('⚠️ Failed to set Supabase user context:', error);
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Local user database - you can add more users here
const localUsers = [
  {
    id: '1',
    email: 'rob.reichstorer@gmail.com',
    password: 'mubqaZ-piske5-xecdur',
    name: 'Rob Reichstorer',
    avatar: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    role: 'administrator'
  },
  // Add more users here as needed
  // {
  //   id: '2',
  //   email: 'teacher@rhythmstix.co.uk',
  //   password: 'teacher123',
  //   name: 'Sarah Teacher',
  //   avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  //   role: 'teacher'
  // }
];

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('rhythmstix_auth_token');
      if (token) {
        // Check if it's a local user token
        if (token.startsWith('rhythmstix_local_')) {
          const userId = token.replace('rhythmstix_local_', '');
          const localUser = localUsers.find(u => u.id === userId);
          
          if (localUser) {
            const userData: User = {
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              avatar: localUser.avatar,
              role: localUser.role
            };
            // Store user ID for database queries
            localStorage.setItem('rhythmstix_user_id', localUser.id);
            // Set Supabase context for RLS
            await setSupabaseUserContext(localUser.id);
            setUser(userData);
          } else {
            localStorage.removeItem('rhythmstix_auth_token');
            localStorage.removeItem('rhythmstix_user_id');
          }
        } else {
          // Try WordPress validation if configured
          const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL;
          if (wordpressUrl && wordpressUrl !== 'https://your-wordpress-site.com') {
            try {
              const isValid = await wordpressAPI.validateToken(token);
              if (isValid) {
                const userInfo = await wordpressAPI.getUserInfo(token);
                const userData: User = {
                  id: userInfo.id.toString(),
                  email: userInfo.email,
                  name: userInfo.name,
                  avatar: userInfo.avatar_urls?.['96'] || userInfo.avatar_urls?.['48'],
                  role: userInfo.roles?.[0] || 'subscriber',
                  token
                };
                // Store user ID for database queries
                localStorage.setItem('rhythmstix_user_id', userInfo.id.toString());
                // Set Supabase context for RLS
                await setSupabaseUserContext(userInfo.id.toString());
                setUser(userData);
              } else {
                localStorage.removeItem('rhythmstix_auth_token');
                localStorage.removeItem('rhythmstix_user_id');
              }
            } catch (error) {
              console.warn('WordPress token validation failed:', error);
              localStorage.removeItem('rhythmstix_auth_token');
            }
          } else {
            localStorage.removeItem('rhythmstix_auth_token');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('rhythmstix_auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // First, check local users
      const localUser = localUsers.find(u => u.email === username && u.password === password);
      
      if (localUser) {
        const userData: User = {
          id: localUser.id,
          email: localUser.email,
          name: localUser.name,
          avatar: localUser.avatar,
          role: localUser.role
        };
        
        localStorage.setItem('rhythmstix_auth_token', `rhythmstix_local_${localUser.id}`);
        localStorage.setItem('rhythmstix_user_id', localUser.id);
        // Set Supabase context for RLS
        await setSupabaseUserContext(localUser.id);
        setUser(userData);
        return;
      }
      
      // If not found in local users, try WordPress authentication
      const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL;
      
      if (wordpressUrl && wordpressUrl !== 'https://your-wordpress-site.com') {
        try {
          const authResponse = await wordpressAPI.authenticate(username, password);
          
          if (authResponse.token) {
            localStorage.setItem('rhythmstix_auth_token', authResponse.token);
            const userInfo = await wordpressAPI.getUserInfo(authResponse.token);
            
            const userData: User = {
              id: userInfo.id.toString(),
              email: userInfo.email,
              name: userInfo.name,
              avatar: userInfo.avatar_urls?.['96'] || userInfo.avatar_urls?.['48'],
              role: userInfo.roles?.[0] || 'subscriber',
              token: authResponse.token
            };
            
            // Store user ID for database queries
            localStorage.setItem('rhythmstix_user_id', userInfo.id.toString());
            // Set Supabase context for RLS
            await setSupabaseUserContext(userInfo.id.toString());
            
            setUser(userData);
            return;
          } else {
            throw new Error('No token received from WordPress');
          }
        } catch (wpError) {
          console.warn('WordPress authentication failed:', wpError);
          // Don't throw here, fall through to generic error
        }
      }
      
      // If we get here, authentication failed
      throw new Error('Invalid credentials. Please check your email and password.');
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rhythmstix_auth_token');
    localStorage.removeItem('rhythmstix_user_id');
    setUser(null);
    // Clear Supabase context
    setSupabaseUserContext('').catch(err => console.warn('Failed to clear Supabase context:', err));
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, useAuth };