import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Health Tracker</h1>
      <p className="text-sm text-gray-500">Sign in to view your data.</p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium shadow-sm hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </form>
    </main>
  );
}
