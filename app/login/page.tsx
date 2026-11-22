import { login } from "./actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <Card className="max-w-sm mx-auto mt-12">
      <form action={login} className="card-body gap-3">
        <CardTitle as="h1">Log in</CardTitle>
        {error && <Notice tone="error">{error}</Notice>}
        <label className="floating-label">
          <span>Email</span>
          <input name="email" type="email" required placeholder="Email" className="input w-full" autoComplete="email" />
        </label>
        <label className="floating-label">
          <span>Password</span>
          <input name="password" type="password" required placeholder="Password" className="input w-full" autoComplete="current-password" />
        </label>
        <button className="btn btn-primary">Log in</button>
      </form>
    </Card>
  );
}
