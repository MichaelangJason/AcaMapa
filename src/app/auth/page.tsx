import { providerMap, signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

const SIGNIN_ERROR_URL = "/auth/error";

const AuthPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}) => {
  const { callbackUrl } = await searchParams;

  return (
    <section className="auth-card">
      <h1>Sign in to DegreeMapper</h1>

      {Object.values(providerMap).map((provider) => (
        <form
          key={provider.id}
          action={async (formData: FormData) => {
            "use server";

            const email = formData.get("email") as string;
            if (
              !email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
            ) {
              return redirect(`${SIGNIN_ERROR_URL}?error=InvalidEmail`);
            }

            try {
              await signIn(provider.id, {
                email: formData.get("email") as string,
                redirectTo: callbackUrl ?? "/",
              });
            } catch (error) {
              // Signin can fail for a number of reasons, such as the user
              // not existing, or the user not having the correct role.
              // In some cases, you may want to redirect to a custom error
              if (error instanceof AuthError) {
                return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`);
              }

              // Otherwise if a redirects happens Next.js can handle it
              // so you can just re-thrown the error and let Next.js handle it.
              // Docs:
              // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
              throw error;
            }
          }}
        >
          <input
            name="email"
            id="email"
            placeholder="mcgill.ca or mail.mcgill.ca"
            required
          />
          <button className="clickable signin" type="submit">
            Sign in with McGill Email
          </button>
        </form>
      ))}
    </section>
  );
};

export default AuthPage;
