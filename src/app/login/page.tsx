'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getCsrfToken, setAuthToken, extractCsrfToken } from '@/lib/api';


export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First get CSRF token
      await getCsrfToken();
      
      // Extract the token from cookies
      const csrfToken = extractCsrfToken();
      if (!csrfToken) {
        throw new Error('Failed to retrieve CSRF token');
      }

      // Make login request with CSRF token in headers
      const response = await api.post('/login', { 
        email, 
        password 
      }, {
        headers: {
          'X-XSRF-TOKEN': csrfToken
        }
      });

      if (!response.data.token) {
        throw new Error('Authentication failed - no token received');
      }

      setAuthToken(response.data.token);
      router.push('/home');
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Credenciais inválidas ou erro no servidor.';
      
      if (err.response) {
        if (err.response.status === 419) {
          errorMessage = 'Sessão expirada. Por favor, recarregue a página e tente novamente.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center">Login</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            className="mt-1 w-full px-4 py-2 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            required
            className="mt-1 w-full px-4 py-2 border rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
