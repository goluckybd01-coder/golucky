import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Loader2, ArrowLeft, AlertTriangle, Bug, Copy, CheckCircle, XCircle, ExternalLink, Wifi, RefreshCw, Trash2 } from 'lucide-react';
import { getAdminState, initAdminAuth, signInAdmin, signOutAdmin } from '@/lib/adminAuthStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminTotpGate from '@/components/admin/AdminTotpGate';

// Constants
const AUTH_TIMEOUT_MS = 10000; // 10 second timeout
const HEALTH_CHECK_TIMEOUT_MS = 5000;

// Debug log entry interface
interface DebugLogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'request';
  message: string;
  details?: Record<string, unknown>;
}

// Minimal JWT payload decoder (no verification) for debug-only checks
const decodeJwtPayload = (jwt: string): Record<string, unknown> | null => {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const maskHost = (hostname: string) => {
  if (!hostname) return 'Not set';
  if (hostname.length <= 10) return hostname;
  return `${hostname.slice(0, 4)}…${hostname.slice(-4)}`;
};

// Environment validation
const getEnvConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  
  const isUrlValid = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.');
  const isKeyValid = anonKey.length > 50;
  
  let maskedUrl = 'Not set';
  let urlProjectRef: string | null = null;
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      urlProjectRef = url.hostname.split('.')[0] || null;
      maskedUrl = maskHost(url.hostname);
    } catch {
      maskedUrl = 'Invalid URL';
    }
  }

  const anonKeyPayload = anonKey ? decodeJwtPayload(anonKey) : null;
  const keyProjectRef = (anonKeyPayload?.ref as string | undefined) || null;
  const isProjectMatch = Boolean(urlProjectRef && keyProjectRef && urlProjectRef === keyProjectRef);
  
  return {
    supabaseUrl,
    anonKey,
    maskedUrl,
    urlProjectRef,
    keyProjectRef,
    isProjectMatch,
    isUrlValid,
    isKeyValid,
    isConfigValid: isUrlValid && isKeyValid,
  };
};

// Health check function - NOW includes API key
const checkSupabaseHealth = async (supabaseUrl: string, anonKey: string): Promise<{ 
  ok: boolean; 
  status: string; 
  latencyMs: number;
  responseBody?: string;
  statusCode?: number;
  requestUrl?: string;
}> => {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  const requestUrl = `${supabaseUrl}/auth/v1/health`;
  
  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey, // Include the API key!
      },
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch {
      responseBody = '[Could not read body]';
    }
    
    if (response.ok) {
      return { ok: true, status: 'Connected', latencyMs, statusCode: response.status, responseBody, requestUrl };
    } else if (response.status === 503) {
      return { ok: false, status: 'Project paused', latencyMs, statusCode: response.status, responseBody, requestUrl };
    } else if (response.status === 401) {
      return { ok: false, status: 'API key missing/invalid', latencyMs, statusCode: response.status, responseBody, requestUrl };
    } else {
      return { ok: false, status: `HTTP ${response.status}`, latencyMs, statusCode: response.status, responseBody, requestUrl };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { ok: false, status: 'Timeout - unreachable', latencyMs, requestUrl };
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        return { ok: false, status: 'Network error / CORS blocked', latencyMs, requestUrl };
      }
      return { ok: false, status: err.message, latencyMs, requestUrl };
    }
    return { ok: false, status: 'Unknown error', latencyMs, requestUrl };
  }
};

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [needsTotp, setNeedsTotp] = useState(false);
  
  // Debug panel state
  const [showDebug, setShowDebug] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean; status: string; latencyMs?: number; responseBody?: string; statusCode?: number } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);

  const mountedRef = useRef(true);
  const envConfig = useMemo(() => getEnvConfig(), []);

  // Add debug log helper
  const addDebugLog = (type: DebugLogEntry['type'], message: string, details?: Record<string, unknown>) => {
    setDebugLogs(prev => [...prev.slice(-19), {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      type,
      message,
      details,
    }]);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Check existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      addDebugLog('info', 'Initializing admin auth session...');
      
      const safetyTimer = setTimeout(() => {
        if (mountedRef.current) {
          console.warn('[ADMIN LOGIN] Session check timeout');
          addDebugLog('error', 'Session check timeout after 5s');
          setIsCheckingAuth(false);
        }
      }, 5000);

      try {
        // IMPORTANT: Initialize the centralized store so AdminLayout can guard routes reliably.
        await initAdminAuth();

        const state = getAdminState();
        if (state.session && state.staffAccount) {
          addDebugLog('success', 'Existing admin session found, redirecting...');
          navigate('/admin/dashboard', { replace: true });
          return;
        }

        addDebugLog('info', 'No active admin session');
      } catch (err) {
        console.error('[ADMIN LOGIN] Session check error:', err);
        addDebugLog('error', 'Session check error', { error: err instanceof Error ? err.message : String(err) });
      } finally {
        clearTimeout(safetyTimer);
        if (mountedRef.current) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkExistingSession();
  }, [navigate]);

  // Test Supabase connection
  const handleTestConnection = async () => {
    if (!envConfig.supabaseUrl || !envConfig.anonKey) {
      setHealthStatus({ ok: false, status: 'No Supabase URL/Key configured' });
      addDebugLog('error', 'Cannot test - missing configuration');
      return;
    }
    
    setIsTestingConnection(true);
    setHealthStatus(null);
    addDebugLog('request', `Testing connection to ${envConfig.maskedUrl}...`);
    
    const result = await checkSupabaseHealth(envConfig.supabaseUrl, envConfig.anonKey);
    
    if (mountedRef.current) {
      setHealthStatus(result);
      setIsTestingConnection(false);
      
      if (result.ok) {
        addDebugLog('success', `Connected (${result.latencyMs}ms)`);
      } else {
        addDebugLog('error', `Connection failed: ${result.status}`, { 
          statusCode: result.statusCode,
          responseBody: result.responseBody?.substring(0, 200),
        });
      }
    }
  };

  // Clear all session data
  const handleClearSession = async () => {
    addDebugLog('info', 'Clearing all session data...');
    
    // Sign out from Supabase
    try {
      await signOutAdmin();
      addDebugLog('success', 'Sign out completed');
    } catch (err) {
      addDebugLog('error', 'SignOut error', { error: err instanceof Error ? err.message : String(err) });
    }
    
    // Clear all admin-related localStorage items
    const keysToRemove = [
      'gl_admin_token',
      'gl_admin_role', 
      'gl_admin_profile',
      'pending_admin_email',
      'sb-gpcjwmaffrqliccdxnqt-auth-token',
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch {
        // Ignore
      }
    });
    
    // Also clear any Supabase auth keys
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore
        }
      }
    });
    
    addDebugLog('success', 'All session data cleared');
    setError('');
    
    toast({
      title: "Session Cleared",
      description: "All tokens removed. Please try logging in again.",
    });
  };

  // Copy debug info
  const handleCopyDebug = async () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      origin: window.location.origin,
      supabaseUrl: envConfig.maskedUrl,
      supabaseUrlValid: envConfig.isUrlValid,
      anonKeyPresent: envConfig.isKeyValid,
      configValid: envConfig.isConfigValid,
      healthStatus: healthStatus || 'Not tested',
      lastError: error || null,
      logs: debugLogs,
      userAgent: navigator.userAgent,
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Debug info copied!' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  // Handle login form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!envConfig.isConfigValid) {
      setError('Supabase configuration is missing. Check ENV variables.');
      addDebugLog('error', 'Login blocked - invalid configuration');
      return;
    }
    
    setError('');
    setIsLoading(true);
    addDebugLog('info', 'Starting login process...');

    const trimmedEmail = email.trim().toLowerCase();
    
    // Validate inputs
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password');
      addDebugLog('error', 'Validation failed - missing email or password');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      addDebugLog('error', 'Validation failed - invalid email format');
      setIsLoading(false);
      return;
    }

    try {
      // STEP 1: Health check first (with API key now)
      addDebugLog('request', 'Running health check...');
      const healthResult = await checkSupabaseHealth(envConfig.supabaseUrl, envConfig.anonKey);
      
      addDebugLog('request', `Health check result: ${healthResult.status}`, {
        requestUrl: healthResult.requestUrl ? maskHost(new URL(healthResult.requestUrl).hostname) + new URL(healthResult.requestUrl).pathname : undefined,
        ok: healthResult.ok,
        statusCode: healthResult.statusCode,
        latencyMs: healthResult.latencyMs,
        responseBody: healthResult.responseBody?.substring(0, 100),
      });
      
      if (!healthResult.ok) {
        if (healthResult.status.includes('paused')) {
          setError('Backend project is paused. Please resume it in Cloud View.');
        } else if (healthResult.status.includes('Timeout') || healthResult.status.includes('unreachable')) {
          setError('Cannot reach backend. Check if the project is active and your network connection.');
        } else {
          setError(`Connection failed: ${healthResult.status}`);
        }
        setIsLoading(false);
        return;
      }

      // STEP 2: Authenticate + verify via centralized store (server-verified)
      addDebugLog('request', `Authenticating ${trimmedEmail}...`);
      const loginResult = await signInAdmin(trimmedEmail, password);

      if (!loginResult.success) {
        addDebugLog('error', 'Login failed', {
          error: loginResult.error,
          status: loginResult.status,
          details: loginResult.details,
        });
        setError(loginResult.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Double-check store state so AdminLayout will allow access
      const state = getAdminState();
      if (!state.session || !state.staffAccount) {
        addDebugLog('error', 'Login completed but admin state missing');
        setError('Login completed but session state was not established. Please click “Clear Session & Retry” and try again.');
        setIsLoading(false);
        return;
      }

      addDebugLog('success', 'Password verified. Checking 2FA…');

      // Gate super_admin (and any account with TOTP enabled) behind the TOTP step.
      // Non-super_admin without TOTP will be passed through instantly inside AdminTotpGate.
      setNeedsTotp(true);
      setIsLoading(false);
      return;
      
    } catch (err) {
      console.error('[ADMIN LOGIN] Unexpected error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addDebugLog('error', 'Unexpected error', { message: msg });
      setError(`Unexpected error: ${msg}`);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const isLoginDisabled = isLoading || !envConfig.isConfigValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-slate-400 text-sm">GoLucky Admin Panel</p>
          </div>

          {/* Config Warning */}
          {!envConfig.isConfigValid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6"
            >
              <div className="flex items-start gap-2 text-yellow-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Backend ENV missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.</p>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6"
            >
              <div className="flex items-start gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm break-words">{error}</p>
              </div>
            </motion.div>
          )}

          {/* 2FA gate — shown after successful password step */}
          {needsTotp ? (
            <AdminTotpGate
              onComplete={() => {
                toast({ title: 'Login Successful', description: 'Welcome to GoLucky Admin Panel' });
                navigate('/admin/dashboard', { replace: true });
              }}
              onCancel={() => {
                setNeedsTotp(false);
                setError('Sign-in cancelled.');
              }}
            />
          ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-11 bg-slate-900/50 border-slate-600 focus:border-amber-500 text-white"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 pr-11 bg-slate-900/50 border-slate-600 focus:border-amber-500 text-white"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoginDisabled}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-6 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
          )}

          {/* Clear Session Button */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearSession}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Session & Retry
            </Button>
          </div>

          {/* Debug Panel Toggle */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs transition-colors w-full justify-center"
            >
              <Bug className="w-3 h-3" />
              {showDebug ? 'Hide Debug Panel' : 'Show Debug Panel'}
            </button>
          </div>

          {/* Debug Panel */}
          {showDebug && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 bg-slate-900/70 rounded-lg p-4 text-xs space-y-3"
            >
              <h3 className="text-slate-300 font-semibold flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Debug Info
              </h3>
              
              {/* Environment Info */}
              <div className="space-y-2 text-slate-400">
                <div className="flex justify-between">
                  <span>Backend URL:</span>
                  <span className={`font-mono ${envConfig.isUrlValid ? 'text-green-400' : 'text-red-400'}`}>
                    {envConfig.maskedUrl}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Project Match:</span>
                  <span className={`font-mono ${envConfig.isProjectMatch ? 'text-green-400' : 'text-red-400'}`}>
                    {envConfig.isProjectMatch ? 'URL=KEY ✓' : 'Mismatch ✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>API Key:</span>
                  <span className={`font-mono ${envConfig.isKeyValid ? 'text-green-400' : 'text-red-400'}`}>
                    {envConfig.isKeyValid ? 'Present ✓' : 'Missing ✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Auth Timeout:</span>
                  <span className="font-mono text-slate-300">{AUTH_TIMEOUT_MS / 1000}s</span>
                </div>
              </div>

              {/* Health Status */}
              {healthStatus && (
                <div className={`p-2 rounded ${
                  healthStatus.ok ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {healthStatus.ok ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                    <span className={healthStatus.ok ? 'text-green-400' : 'text-red-400'}>
                      {healthStatus.status}
                      {healthStatus.latencyMs !== undefined && ` (${healthStatus.latencyMs}ms)`}
                    </span>
                  </div>
                  {healthStatus.statusCode && !healthStatus.ok && (
                    <div className="mt-1 text-slate-400 text-[10px]">
                      Status: {healthStatus.statusCode} | Body: {healthStatus.responseBody?.substring(0, 80)}...
                    </div>
                  )}
                </div>
              )}

              {/* Debug Logs */}
              {debugLogs.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-black/30 rounded p-2 space-y-1">
                  {debugLogs.map((log, i) => (
                    <div key={i} className={`text-[10px] font-mono ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'request' ? 'text-blue-400' :
                      'text-slate-400'
                    }`}>
                      <span className="text-slate-500">{log.timestamp}</span>{' '}
                      [{log.type.toUpperCase()}] {log.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !envConfig.supabaseUrl}
                  className="text-xs h-8 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {isTestingConnection ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Wifi className="w-3 h-3 mr-1" />
                  )}
                  Test Connection
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDebug}
                  className="text-xs h-8 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {copied ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? 'Copied!' : 'Copy Debug'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDebugLogs([])}
                  className="text-xs h-8 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Clear Logs
                </Button>
              </div>
            </motion.div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-amber-500 text-sm inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main Site
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
