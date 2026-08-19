'use client';

import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { paths } from '@/routes/paths';
import Google from '@/components/icons/google';
import { useForm } from 'react-hook-form';
import { useAuthContext } from '@/auth/hooks';
import { getErrorMessage, getOAuthErrorMessage } from '@/auth/context/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PATH_AFTER_SIGN_IN } from '@/lib/config';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@/components/ui/loading-button';
import { useRouter, useSearchParams } from 'next/navigation';
import FormProvider from '@/components/hook-form/form-provider';
import { FormItem, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from '@/components/ui/card';
// ----------------------------------------------------------------------

export default function SignInView({ className, ...props }: React.ComponentProps<'div'>) {
  const { signIn, signInWithGoogle } = useAuthContext();

  const router = useRouter();
  const searchParams = useSearchParams();

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const oauthError = getOAuthErrorMessage(searchParams.get('error'));
    if (oauthError) {
      setErrorMsg(oauthError);
    }
  }, [searchParams]);

  const SignInSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Email must be a valid email address'),
    password: z.string().min(1, 'Password is required'),
  });

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signIn(data.email, data.password);

      router.push(PATH_AFTER_SIGN_IN);
    } catch (error) {
      console.error(error);
      reset();
      setErrorMsg(getErrorMessage(error));
    }
  });

  const renderHead = (
    <CardHeader className="text-center">
      <CardTitle className="text-xl">Welcome back</CardTitle>
      <CardDescription>Sign in to your AgentHub account</CardDescription>
    </CardHeader>
  );

  const renderForm = (
    <CardContent>
      <div className="grid gap-6">
        {!!errorMsg && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMsg}
          </div>
        )}
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
                <FormLabel>Password</FormLabel>
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
              onClick={() => signInWithGoogle()}
            >
              <Google />
              Sign in with Google
            </Button>
          </div>

          <LoadingButton type="submit" className="w-full" loading={isSubmitting}>
            Sign in
          </LoadingButton>
        </div>
      </div>
    </CardContent>
  );

  const renderFooter = (
    <div className="text-center text-sm">
      Don&apos;t have an account?{' '}
      <Link href={paths.auth.signUp} className="underline underline-offset-4">
        Sign up
      </Link>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        {renderHead}

        <FormProvider methods={methods} onSubmit={onSubmit}>
          {renderForm}
        </FormProvider>

        {renderFooter}
      </Card>
    </div>
  );
}
