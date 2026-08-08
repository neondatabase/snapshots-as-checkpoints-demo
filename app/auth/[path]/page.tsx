import Image from "next/image";
import Link from "next/link";
import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import logo from "@/assets/logo.svg";
import logoDark from "@/assets/logo-dark.svg";
import { ModeToggle } from "@/components/theme-toggle";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full py-3">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 md:px-8 lg:px-0">
          <Link href="/" aria-label="Neon Snapshots Demo">
            <Image
              className="dark:hidden"
              src={logo}
              alt="Neon"
              width={88}
              height={24}
              priority
            />
            <Image
              className="hidden dark:block"
              src={logoDark}
              alt="Neon"
              width={88}
              height={24}
              priority
            />
          </Link>
          <ModeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-5">
        <AuthView path={path} />
      </main>
    </div>
  );
}
