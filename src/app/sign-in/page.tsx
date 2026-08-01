import Image from "next/image";
import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-8">
      <Image src="/icon-512.png" alt="" width={72} height={72} className="rounded-2xl" />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide text-hi">Stride</h1>
        <p className="text-sm text-dim">Sign in to view your data.</p>
      </div>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-ignite px-5 py-2.5 font-bold text-ignite-fg shadow-sm hover:bg-ignite-hover"
        >
          Sign in with Google
        </button>
      </form>
    </main>
  );
}
