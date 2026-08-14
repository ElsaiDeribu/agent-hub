'use client';

import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { paths } from '@/routes/paths';
import Google from '@/components/icons/google';
import { useForm } from 'react-hook-form';
import { useAuthContext } from '@/auth/hooks';
import { getErrorMessage } from '@/auth/context/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PATH_AFTER_LOGIN } from '@/lib/config';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@/components/ui/loading-button';
import { useRouter } from 'next/navigation';
import FormProvider from '@/components/hook-form/form-provider';
import { FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from '@/components/ui/card';
// ----------------------------------------------------------------------

export default function LoginView({ className, ...props }: React.ComponentProps<'div'>) {
  const { login, loginWithGoogle } = useAuthContext();

  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');

  const LoginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Email must be a valid email address'),
    password: z.string().min(1, 'Password is required'),
  });

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.email, data.password);

      router.push(PATH_AFTER_LOGIN);
    } catch (error) {
      console.error(error);
      reset();
      setErrorMsg(getErrorMessage(error));
    }
  });

  const renderHead = (
    <CardHeader className="text-center">
      <CardTitle className="text-xl">Welcome back</CardTitle>
      <CardDescription>Login to your Boilerplate account</CardDescription>
    </CardHeader>
  );

  const renderForm = (
    <CardContent>
      <div className="grid gap-6">
        <div className="grid gap-6">
          <FormField
            control={methods.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="m@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={paths.auth.forgotPassword}
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-card text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => loginWithGoogle()}
            >
              <Google />
              Login with Google
            </Button>
          </div>

          <LoadingButton type="submit" className="w-full" loading={isSubmitting}>
            Login
          </LoadingButton>
        </div>
      </div>
    </CardContent>
  );

  const renderFooter = (
    <div className="text-center text-sm">
      Don&apos;t have an account?{' '}
      <Link href={paths.auth.register} className="underline underline-offset-4">
        Sign up
      </Link>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        {renderHead}

        <FormProvider methods={methods} onSubmit={onSubmit}>
          {!!errorMsg && <h1 style={{ marginBottom: 3, color: 'red' }}>{errorMsg}</h1>}
          {renderForm}
        </FormProvider>

        {renderFooter}
      </Card>
    </div>
  );
}
