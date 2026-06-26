import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { signIn } from '@/lib/auth/auth-store';
import { View } from '@/tw';

const schema = z.object({
  email: z.string().min(1, 'E-mail kræves').email('Ugyldig e-mail'),
  password: z.string().min(1, 'Adgangskode kræves'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
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

        <Form onSubmit={onSubmit}>
          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField label="E-mail" error={errors.email?.message}>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    invalid={!!errors.email}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    placeholder="dig@eksempel.dk"
                  />
                </FormField>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField label="Adgangskode" error={errors.password?.message}>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    invalid={!!errors.password}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </FormField>
              )}
            />

            {submitError ? <AppText className="text-danger">{submitError}</AppText> : null}

            <Button title="Log ind" onPress={onSubmit} loading={isSubmitting} />
          </View>
        </Form>
      </View>
    </Screen>
  );
}
