'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/projects');
    } else {
      // Redirect to Clerk's hosted sign-in page with redirect URL
      window.location.href = "https://immortal-turkey-12.accounts.dev/sign-in?redirect_url=" + encodeURIComponent("http://localhost:3000/projects");
    }
  }, [isSignedIn, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
