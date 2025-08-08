import "@/styles/auth.scss";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="auth-page">{children}</section>;
}
