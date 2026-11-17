import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="card bg-base-100 shadow max-w-sm mx-auto mt-12">
      <form action={login} className="card-body gap-3">
        <h1 className="card-title">Log in</h1>
        {error && <div role="alert" className="alert alert-error">{error}</div>}
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
    </div>
  );
}
