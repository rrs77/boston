import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { wordpressAPI } from '../config/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  token?: string;
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
  // },
  // Example view-only user:
  // {
  //   id: '3',
  //   email: 'viewer@rhythmstix.co.uk',
  //   password: 'viewer123',
  //   name: 'View Only User',
  //   avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  //   role: 'viewer'
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
      // DEV MODE: Auto-login for local development
      if (import.meta.env.DEV && !localStorage.getItem('rhythmstix_auth_token')) {
        const devUser = localUsers[0];
        if (devUser) {
          console.log('🔧 DEV MODE: Auto-logging in as', devUser.email);
          localStorage.setItem('rhythmstix_auth_token', `rhythmstix_local_${devUser.id}`);
          setUser({
            id: devUser.id,
            email: devUser.email,
            name: devUser.name,
            avatar: devUser.avatar,
            role: devUser.role
          });
          setLoading(false);
          return;
        }
      }
      
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
            setUser(userData);
          } else {
            localStorage.removeItem('rhythmstix_auth_token');
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
                setUser(userData);
              } else {
                localStorage.removeItem('rhythmstix_auth_token');
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
      
      // TESTING MODE: Allow blank password for admin user
      const localUser = localUsers.find(u => {
        if (u.email === username) {
          // Allow blank password OR correct password during testing
          return password === '' || u.password === password;
        }
        return false;
      });
      
      if (localUser) {
        const userData: User = {
          id: localUser.id,
          email: localUser.email,
          name: localUser.name,
          avatar: localUser.avatar,
          role: localUser.role
        };
        
        localStorage.setItem('rhythmstix_auth_token', `rhythmstix_local_${localUser.id}`);
        setUser(userData);
        return;
      }
      
      // If not found in local users, try WordPress authentication
      const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL;
      
      console.log('🔍 WordPress Debug:', {
        wordpressUrl,
        isConfigured: wordpressUrl && wordpressUrl !== 'https://your-wordpress-site.com',
        username
      });
      
      if (wordpressUrl && wordpressUrl !== 'https://your-wordpress-site.com') {
        try {
          console.log('🔄 Attempting WordPress authentication...');
          const authResponse = await wordpressAPI.authenticate(username, password);
          console.log('✅ WordPress auth response:', authResponse);
          
          if (authResponse.token) {
            localStorage.setItem('rhythmstix_auth_token', authResponse.token);
            console.log('🔄 Getting user info from WordPress...');
            const userInfo = await wordpressAPI.getUserInfo(authResponse.token);
            console.log('✅ WordPress user info:', userInfo);
            
            const userData: User = {
              id: userInfo.id.toString(),
              email: userInfo.email,
              name: userInfo.name,
              avatar: userInfo.avatar_urls?.['96'] || userInfo.avatar_urls?.['48'],
              role: userInfo.roles?.[0] || 'subscriber',
              token: authResponse.token
            };
            
            setUser(userData);
            console.log('✅ WordPress login successful!');
            return;
          } else {
            throw new Error('No token received from WordPress');
          }
        } catch (wpError) {
          console.error('❌ WordPress authentication failed:', wpError);
          // Don't throw here, fall through to generic error
        }
      } else {
        console.log('⚠️ WordPress not configured or using default URL');
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
    setUser(null);
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

export { AuthContext };