import { redirect } from "next/navigation";

enum AuthError {
  Configuration = "Configuration",
  Default = "Default",
  AccessDenied = "AccessDenied",
  Verification = "Verification",
  InvalidEmail = "InvalidEmail",
}

const errorMap = {
  [AuthError.Configuration]: (
    <p>
      There was an error configuring the authentication provider.
      <br />
      Please contact the administrator.
    </p>
  ),
  [AuthError.Default]: (
    <p>
      An unknown error occurred.
      <br />
      <br />
      Please send an email to{" "}
      <a className="clickable support" href="mailto:support@acamapa.ai">
        support@acamapa.ai
      </a>{" "}
      or open an issue on{" "}
      <a
        className="clickable support"
        href="https://github.com/MichaelangJason/AcaMapa/issues"
      >
        GitHub
      </a>
      .
    </p>
  ),
  [AuthError.AccessDenied]: (
    <p>
      You do not have permission to sign in.
      <br />
      It&apos;s only available for McGill students/staffs.
    </p>
  ),
  [AuthError.Verification]: (
    <p>
      The token has expired or has already been used.
      <br />
      Please try again.
    </p>
  ),
  [AuthError.InvalidEmail]: (
    <p>
      The email is invalid.
      <br />
      Please enter a valid McGill email.
    </p>
  ),
};

const AuthErrorPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) => {
  const { error } = await searchParams;

  return (
    <section className="auth-card">
      <h1>Error</h1>
      {errorMap[error as AuthError] ?? errorMap[AuthError.Default]}

      <section className="auth-card-actions">
        <button
          className="clickable"
          onClick={async () => {
            "use server";

            return redirect("/auth");
          }}
        >
          Back to Sign In
        </button>
        <button
          className="clickable"
          onClick={async () => {
            "use server";

            return redirect("/");
          }}
        >
          Back to AcaMapa
        </button>
      </section>
    </section>
  );
};

export default AuthErrorPage;
