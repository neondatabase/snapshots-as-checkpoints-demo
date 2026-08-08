import Image from "next/image";
import logo from "@/assets/logo.svg";
import logoDark from "@/assets/logo-dark.svg";
import Link from "next/link";
import docs from "@/assets/docs.svg";
import { getSessionUser } from "@/lib/auth/server";
import { ModeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { HomeCreateButton } from "./home-create-button";

export const dynamic = "force-dynamic";

const DATA = {
  title: "Neon is Postgres for AI",
  description:
    "Neon Snapshots: instant database checkpoints for your AI agent. Navigate between schema/data states with one click. This demo auto-creates and reuses snapshots as you move forward and back.",
  footerLinks: [
    {
      text: "Snapshot Docs",
      href: "https://neon.com/docs/guides/backup-restore",
      icon: docs,
    },
    {
      text: "View on GitHub",
      href: "https://github.com/neondatabase-labs/snapshots-as-checkpoints-demo",
      icon: docs,
    },
  ],
};

export default async function Home() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full bg-white/80 py-3 backdrop-blur-md dark:bg-black/50">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-end gap-3 px-5 md:px-8 lg:px-0">
          <ModeToggle />
          {user && <UserMenu />}
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 md:px-8 lg:px-0">
        <main className="flex flex-1 flex-col justify-center">
          <div className="mb-6 md:mb-7">
            <Image
              className="lg:h-7 lg:w-auto dark:hidden"
              src={logo}
              alt="Neon logo"
              width={88}
              height={24}
              priority
            />
            <Image
              className="hidden lg:h-7 lg:w-auto dark:block"
              src={logoDark}
              alt="Neon logo"
              width={88}
              height={24}
              priority
            />
          </div>
          <h1
            className="text-3xl font-semibold leading-none tracking-tighter md:text-4xl md:leading-none lg:text-5xl lg:leading-none"
            dangerouslySetInnerHTML={{ __html: DATA.title }}
          />
          <p
            className="mt-3.5 max-w-lg text-base leading-snug tracking-tight text-[#61646B] md:text-lg md:leading-snug lg:text-xl lg:leading-snug dark:text-[#94979E]"
            dangerouslySetInnerHTML={{ __html: DATA.description }}
          />
          <div className="mt-8 flex flex-wrap items-center gap-5 md:mt-9 lg:mt-10">
            {user ? (
              <HomeCreateButton />
            ) : (
              <Button
                asChild
                className="rounded-full bg-[#00E599] px-5 py-2.5 font-semibold tracking-tight text-[#0C0D0D] transition-colors duration-200 hover:bg-[#00E5BF] lg:px-7 lg:py-3"
              >
                <Link href="/auth/sign-in">Sign in to start demo</Link>
              </Button>
            )}
          </div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E5E7] py-5 sm:gap-2 sm:gap-6 md:pb-12 md:pt-10 dark:border-[#303236]">
          <ul className="flex items-center gap-4 sm:gap-6">
            {DATA.footerLinks.map((link) => (
              <Link
                className="flex items-center gap-2 opacity-70 transition-opacity duration-200 hover:opacity-100"
                key={link.text}
                href={link.href}
                target="_blank"
              >
                <Image
                  className="dark:invert"
                  src={link.icon}
                  alt={link.text}
                  width={16}
                  height={16}
                  priority
                />
                <span className="text-sm tracking-tight">{link.text}</span>
              </Link>
            ))}
          </ul>
        </footer>
      </div>
    </div>
  );
}
