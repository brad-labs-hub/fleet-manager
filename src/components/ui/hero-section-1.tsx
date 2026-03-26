"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { cn } from "@/lib/utils";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 isolate z-[2] hidden opacity-50 contain-strict lg:block"
        >
          <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -translate-y-[350px] -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring" as const,
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
            >
              <div className="relative hidden min-h-[28rem] w-full dark:block lg:min-h-[36rem]">
                <Image
                  src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                  alt=""
                  fill
                  className="object-cover object-[center_top] opacity-90 lg:object-[center_20%]"
                  sizes="100vw"
                  priority
                />
              </div>
            </AnimatedGroup>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    href="/signup"
                    className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-border bg-muted p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 hover:bg-background dark:border-t-white/5 dark:shadow-zinc-950 dark:hover:border-t-border"
                  >
                    <span className="text-sm text-foreground">
                      Fleet Manager — receipts, maintenance, and more
                    </span>
                    <span className="block h-4 w-0.5 border-l border-border bg-white dark:border-background dark:bg-zinc-700" />

                    <div className="size-6 overflow-hidden rounded-full bg-background duration-500 group-hover:bg-muted">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <h1 className="mx-auto mt-8 max-w-4xl text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem]">
                    Modern fleet management for families and small teams
                  </h1>
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                    Track vehicles, maintenance, insurance, and receipts in one place — customizable
                    workflows that fit how you actually run your fleet.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div className="rounded-[14px] border border-border bg-foreground/10 p-0.5">
                    <Button asChild size="lg" className="rounded-xl px-5 text-base">
                      <Link href="/signup">
                        <span className="text-nowrap">Get started</span>
                      </Link>
                    </Button>
                  </div>
                  <Button asChild size="lg" variant="ghost" className="h-11 rounded-xl px-5">
                    <Link href="/login">
                      <span className="text-nowrap">Sign in</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div
                  aria-hidden
                  className="absolute inset-0 z-10 bg-gradient-to-b from-transparent from-35% to-background"
                />
                <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-lg shadow-zinc-950/15 ring-1 ring-border dark:shadow-zinc-950/25">
                  <div className="relative aspect-[15/8] w-full">
                    <Image
                      src="https://tailark.com/_next/image?url=%2Fmail2.png&w=3840&q=75"
                      alt="App preview (dark)"
                      fill
                      className="relative hidden rounded-2xl object-cover dark:block"
                      sizes="(max-width: 1152px) 100vw, 1152px"
                    />
                    <Image
                      src="https://tailark.com/_next/image?url=%2Fmail2-light.png&w=3840&q=75"
                      alt="App preview (light)"
                      fill
                      className="relative rounded-2xl border border-border/25 object-cover dark:hidden"
                      sizes="(max-width: 1152px) 100vw, 1152px"
                    />
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        <section className="bg-background pb-16 pt-16 md:pb-32">
          <div className="group relative m-auto max-w-5xl px-6">
            <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
              <Link href="/signup" className="block text-sm duration-150 hover:opacity-75">
                <span> Start free</span>
                <ChevronRight className="ml-1 inline-block size-3" />
              </Link>
            </div>
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 group-hover:blur-sm sm:gap-x-16 sm:gap-y-14">
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mx-auto h-5 w-auto dark:invert"
                  src="https://html.tailus.io/blocks/customers/nvidia.svg"
                  alt="Nvidia"
                  height={20}
                  width={80}
                />
              </div>
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mx-auto h-4 w-auto dark:invert"
                  src="https://html.tailus.io/blocks/customers/column.svg"
                  alt="Column"
                  height={16}
                  width={80}
                />
              </div>
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mx-auto h-4 w-auto dark:invert"
                  src="https://html.tailus.io/blocks/customers/github.svg"
                  alt="GitHub"
                  height={16}
                  width={80}
                />
              </div>
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mx-auto h-5 w-auto dark:invert"
                  src="https://html.tailus.io/blocks/customers/nike.svg"
                  alt="Nike"
                  height={20}
                  width={80}
                />
              </div>
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mx-auto h-5 w-auto dark:invert"
                  src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                  alt="Lemon Squeezy"
                  height={20}
                  width={100}
                />
              </div>
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mx-auto h-4 w-auto dark:invert"
                  src="https://html.tailus.io/blocks/customers/laravel.svg"
                  alt="Laravel"
                  height={16}
                  width={80}
                />
              </div>
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mx-auto h-7 w-auto dark:invert"
                  src="https://html.tailus.io/blocks/customers/lilly.svg"
                  alt="Lilly"
                  height={28}
                  width={80}
                />
              </div>
              <div className="flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mx-auto h-6 w-auto dark:invert"
                  src="https://html.tailus.io/blocks/customers/openai.svg"
                  alt="OpenAI"
                  height={24}
                  width={80}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const menuItems = [
  { name: "Features", href: "#" },
  { name: "Solution", href: "#" },
  { name: "Pricing", href: "#" },
  { name: "About", href: "#" },
];

function HeroHeader() {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState ? "active" : undefined}
        className="group fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "max-w-4xl rounded-2xl border border-border bg-background/50 px-5 backdrop-blur-lg lg:px-5",
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" aria-label="Fleet Manager home" className="flex items-center space-x-2">
                <Logo />
              </Link>

              <button
                type="button"
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close menu" : "Open menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="m-auto size-6 duration-200 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-border bg-background p-6 shadow-2xl shadow-zinc-300/20 group-data-[state=active]:block md:flex-nowrap dark:shadow-none lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="/login">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className={cn(isScrolled && "lg:hidden")}>
                  <Link href="/signup">
                    <span>Sign Up</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className={cn(isScrolled ? "lg:inline-flex" : "hidden")}>
                  <Link href="/signup">
                    <span>Get Started</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-syne text-[10px] font-bold tracking-wide text-white shadow-sm">
        FM
      </span>
      <span className="font-syne text-sm font-bold leading-none text-foreground">
        <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Fleet
        </span>
        <span className="text-foreground"> Manager</span>
      </span>
    </span>
  );
}
