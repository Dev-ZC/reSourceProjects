'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  const handleGoHome = () => {
    if (isLoaded && isSignedIn) {
      router.push('/projects');
    } else {
      router.push('/');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className="text-8xl font-bold text-gray-600 mb-4">404</div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        
        {/* Description */}
        <p className="text-gray-400 mb-8 text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleGoHome}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
        
        {/* Additional Help */}
        <div className="mt-8 text-sm text-gray-500">
          <p>If you think this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
