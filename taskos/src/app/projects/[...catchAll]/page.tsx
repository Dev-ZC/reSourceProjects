'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Loader2 } from 'lucide-react';

function CatchAllContent() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main projects page which will handle proper routing
    router.push('/projects');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-lg">Redirecting to your projects...</p>
    </div>
  );
}

// This catch-all route will handle any invalid project paths
export default function CatchAllProjectPage() {
  return (
    <AuthGuard>
      <CatchAllContent />
    </AuthGuard>
  );
}
