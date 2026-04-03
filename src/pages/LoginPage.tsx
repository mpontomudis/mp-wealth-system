// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { BorderBeam } from '@/components/ui/border-beam';

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (authError) {
      setError(authError.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mp-background px-4 relative overflow-hidden">
      {/* Background glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-blue-500/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/6 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <img
            src="/logo.png"
            alt="MP Wealth"
            className="h-20 w-20 object-contain mb-3 drop-shadow-xl"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-white">MP Wealth System</h1>
          <p className="text-sm text-gray-400">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-mp-surface/70 backdrop-blur-2xl p-8 shadow-card animate-fade-in">
          <BorderBeam
            colorFrom="#3b82f6"
            colorTo="#8b5cf6"
            size={180}
            duration={10}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              leftIcon={<Mail size={15} />}
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={15} />}
              {...register('password', { required: 'Password is required' })}
              error={errors.password?.message}
            />

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-mp-red/10 border border-mp-red/20 px-4 py-3">
                <AlertCircle size={15} className="text-mp-red shrink-0 mt-0.5" />
                <p className="text-sm text-mp-red">{error}</p>
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-1 h-10">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-mp-text-muted mt-6 animate-fade-in">
          MP Wealth System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
