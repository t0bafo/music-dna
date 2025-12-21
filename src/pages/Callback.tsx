import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForTokens, storeTokens, clearTokens } from '@/lib/spotify-auth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Connecting to Spotify...');

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const errorParam = urlParams.get('error');

      if (errorParam) {
        setError(`Authentication cancelled: ${errorParam}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      setStatus('Exchanging code for tokens...');

      const tokenData = await exchangeCodeForTokens(code);

      if (!tokenData) {
        setError('Failed to exchange code for tokens. Please try again.');
        clearTokens();
        return;
      }

      setStatus('Authentication successful! Redirecting...');

      storeTokens(
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expires_in
      );

      // Small delay for UX
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="bg-card rounded-xl p-8 card-shadow max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-card-foreground mb-2">Authentication Failed</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/', { replace: true })}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="bg-card rounded-xl p-8 card-shadow max-w-md text-center">
        <Loader2 className="w-12 h-12 animate-spin text-spotify mx-auto mb-4" />
        <h2 className="text-xl font-bold text-card-foreground mb-2">Authenticating</h2>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default Callback;
