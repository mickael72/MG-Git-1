import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { signup } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start your readiness assessment in under three minutes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="signup" action={signup} />
      </CardContent>
    </Card>
  );
}
