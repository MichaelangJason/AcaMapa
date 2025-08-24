const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    magicLink?: string;
    email?: string;
  }>;
}) => {
  const { magicLink, email } = await searchParams;

  if (!magicLink || !email) {
    return <div>Invalid Login Link</div>;
  }

  return (
    <section className="auth-card verify-request">
      <h1>Login Confirmation - AcaMapa</h1>
      <p>
        Continue as <strong>{email}</strong>
      </p>
      <button className="clickable mcgill">
        <a href={magicLink}>Continue</a>
      </button>
    </section>
  );
};

export default LoginPage;
