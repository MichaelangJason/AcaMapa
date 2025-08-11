const VerifyRequestPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    provider?: string;
    type?: string;
  }>;
}) => {
  let { type } = await searchParams;
  type = type ?? "email";

  return (
    <section className="auth-card verify-request">
      <h1>Verify your {type}</h1>
      <p>
        A sign in link has been sent to your {type}.
        <br />
        Check your spam folder if you don&apos;t see it.
      </p>
      <button className="clickable mcgill">
        <a href={`https://mail.cs.mcgill.ca`}>Open McGill Email</a>
      </button>
    </section>
  );
};

export default VerifyRequestPage;
