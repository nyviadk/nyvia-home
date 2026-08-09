import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { ControlledField } from '@/components/ui/controlled-field';
import { Form } from '@/components/ui/form';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { signIn } from '@/lib/auth/auth-store';
import { View } from '@/tw';

const schema = z.object({
  email: z.string().min(1, 'E-mail kræves').email('Ugyldig e-mail'),
  password: z.string().min(1, 'Adgangskode kræves'),
});

type LoginForm = z.infer<typeof schema>;

export function LoginScreen() {
  // Fejl fra selve login-kaldet (ikke validering) — kan ikke udledes af formularens state.
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await signIn(email.trim(), password);
    } catch {
      setSubmitError('Forkert e-mail eller adgangskode.');
    }
  });

  return (
    <Screen>
      <View className="flex-1 justify-center gap-6">
        <View className="gap-1">
          <AppText variant="title">NyviaHome</AppText>
          <AppText variant="muted">Log ind for at fortsætte</AppText>
        </View>

        {/* <Form> er et rigtigt <form> på web, så adgangskode-managere kan autofylde. */}
        <Form onSubmit={onSubmit}>
          <View className="gap-4">
            <ControlledField
              control={control}
              name="email"
              label="E-mail"
              error={errors.email?.message}
              placeholder="dig@eksempel.dk"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <ControlledField
              control={control}
              name="password"
              label="Adgangskode"
              error={errors.password?.message}
              placeholder="••••••••"
              autoCapitalize="none"
              autoComplete="current-password"
              secureTextEntry
            />

            {submitError ? <AppText className="text-danger">{submitError}</AppText> : null}

            <Button title="Log ind" onPress={onSubmit} loading={isSubmitting} />
          </View>
        </Form>
      </View>
    </Screen>
  );
}
