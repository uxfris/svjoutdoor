import AuthForm from "@/components/auth/AuthForm";

interface LoginPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams.error as string;

  return <AuthForm mode="signin" error={error} />;
}
