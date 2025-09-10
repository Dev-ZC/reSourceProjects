'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, createContext, useContext } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType>({ isAuthenticated: false, isLoaded: false });

export const useAuthGuard = () => useContext(AuthContext);

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log('🔍 AUTH GUARD: User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while auth is being determined
  if (!isLoaded) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg">Checking authentication...</p>
      </div>
    );
  }

  // Show loading while redirecting unauthenticated users
  if (!isSignedIn) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg">Redirecting to login...</p>
      </div>
    );
  }

  // Only render children if user is authenticated
  return (
    <AuthContext.Provider value={{ isAuthenticated: isSignedIn, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}
