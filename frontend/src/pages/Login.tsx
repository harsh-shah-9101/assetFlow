import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import api from '../services/api';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        login(response.data.token, response.data.user);
        navigate('/');
      } else {
        await api.post('/auth/signup', { name, email, password });
        // After signup, automatically login or ask to login
        const loginResponse = await api.post('/auth/login', { email, password });
        login(loginResponse.data.token, loginResponse.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-primary-light)] opacity-50 blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-info-bg)] opacity-50 blur-3xl -z-10"></div>

      <Card className="w-full max-w-md glass animate-fade-in relative z-10 border-0 shadow-2xl">
        <CardHeader className="text-center border-b-0 pb-2">
          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">AssetFlow</h1>
          <CardTitle className="text-xl text-[var(--color-text-muted)]">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-sm rounded-md border border-[var(--color-danger)]">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input 
                label="Full Name" 
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
              />
            )}
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              size="lg"
              isLoading={isLoading}
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              className="text-[var(--color-primary)] font-medium hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
