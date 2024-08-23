import React from "react";
import {
  DocsThemeConfig,
  Tabs,
  Tab,
  useConfig,
  Steps,
  Card,
  Cards,
  Callout,
} from "nextra-theme-docs";
import { Logo } from "@/components/logo";
import { useRouter } from "next/router";
import { MainContentWrapper } from "./components/MainContentWrapper";
import { Frame } from "./components/Frame";
import { GithubMenuBadge } from "./components/GitHubBadge";
import { ToAppButton } from "./components/ToAppButton";
import { COOKBOOK_ROUTE_MAPPING } from "./lib/cookbook_route_mapping";
import { GeistSans } from "geist/font/sans";
import IconDiscord from "./components/icons/discord";
import IconLinkedin from "./components/icons/linkedin";
import FooterMenu from "./components/FooterMenu";
import Link from "next/link";
import {
  FileCode,
  LibraryBig,
  CircleHelp,
  Clock9,
  PiggyBank,
} from "lucide-react";
import {
  AvailabilityBanner,
  AvailabilitySidebar,
} from "./components/availability";
import { CloudflareVideo, Video } from "./components/Video";

const config: DocsThemeConfig = {
  logo: <Logo />,
  main: MainContentWrapper,
  search: {
    placeholder: "Search...",
  },
  navbar: {
    extraContent: (
      <>
        <a
          className="p-1 hidden lg:inline-block hover:opacity-80"
          target="_blank"
          href="https://www.linkedin.com/company/go-bluewind"
          aria-label="Bluewind Discord"
          rel="nofollow noreferrer"
        >
          <IconLinkedin className="h-7 w-7" />
        </a>
        <a
          className="p-1 hidden lg:inline-block hover:opacity-80"
          target="_blank"
          href="https://discord.gg/DDMVTYrrKy"
          aria-label="Bluewind Discord"
          rel="nofollow noreferrer"
        >
          <IconDiscord className="h-7 w-7" />
        </a>

        <a
          className="p-1 hidden sm:inline-block hover:opacity-80"
          target="_blank"
          href="https://x.com/bluewind_ai"
          aria-label="Langfuse X formerly known as Twitter"
          rel="nofollow noreferrer"
        >
          <svg
            aria-label="X formerly known as Twitter"
            fill="currentColor"
            width="24"
            height="24"
            viewBox="0 0 24 22"
          >
            <path d="M16.99 0H20.298L13.071 8.26L21.573 19.5H14.916L9.702 12.683L3.736 19.5H0.426L8.156 10.665L0 0H6.826L11.539 6.231L16.99 0ZM15.829 17.52H17.662L5.83 1.876H3.863L15.829 17.52Z"></path>
          </svg>
        </a>

        <GithubMenuBadge />

        <ToAppButton />
      </>
    ),
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
    titleComponent: ({ type, title, route }) => {
      const { asPath } = useRouter();
      if (type === "separator" && title === "Switcher") {
        return (
          <div className="-mx-2 hidden md:block">
            {[
              { title: "Why?", path: "/docs", Icon: CircleHelp },
              {
                title: "Pre-seed round",
                path: "/pre-seed-round",
                Icon: PiggyBank,
              },
            ].map((item) =>
              asPath.startsWith(item.path) ? (
                <div
                  key={item.path}
                  className="group mb-3 flex flex-row items-center gap-3 nx-text-primary-800 dark:nx-text-primary-600"
                >
                  <item.Icon className="w-7 h-7 p-1 border rounded nx-bg-primary-100 dark:nx-bg-primary-400/10" />
                  {item.title}
                </div>
              ) : (
                <Link
                  href={item.path}
                  key={item.path}
                  className="group mb-3 flex flex-row items-center gap-3 text-gray-500 hover:text-primary/100"
                >
                  <item.Icon className="w-7 h-7 p-1 border rounded group-hover:bg-border/30" />
                  {item.title}
                </Link>
              )
            )}
          </div>
        );
      }
      return title;
    },
  },
  editLink: {
    text: "Edit this page on GitHub",
  },
  toc: {
    backToTop: true,
    extraContent: () => {
      const { frontMatter } = useConfig();
      return <AvailabilitySidebar frontMatter={frontMatter} />;
    },
  },
  docsRepositoryBase: "https://github.com/bluewind-ai/bluewind/tree/website",
  footer: {
    text: <FooterMenu />,
  },
  useNextSeoProps() {
    const { asPath } = useRouter();
    const cookbook = COOKBOOK_ROUTE_MAPPING.find(
      (cookbook) => cookbook.path === asPath
    );
    const canonical: string | undefined = cookbook?.canonicalPath
      ? "https://bluewind.ai" + cookbook.canonicalPath
      : undefined;

    return {
      titleTemplate:
        asPath === "/"
          ? "Bluewind"
          : asPath.startsWith("/blog/")
          ? "%s - Bluewind Blog"
          : asPath.startsWith("/docs/guides/")
          ? "%s - Bluewind Guides"
          : "%s - Bluewind",
      canonical,
    };
  },
  head: () => {
    const { asPath, defaultLocale, locale } = useRouter();
    const { frontMatter, title: pageTitle } = useConfig();
    const url =
      "https://bluewind.ai" +
      (defaultLocale === locale ? asPath : `/${locale}${asPath}`);

    const description = frontMatter.description ?? "";

    const title = frontMatter.title ?? pageTitle;

    const section = asPath.startsWith("/docs")
      ? "Docs"
      : asPath.startsWith("/changelog/")
      ? "Changelog"
      : asPath.startsWith("/cookbook/")
      ? "Cookbook"
      : asPath.startsWith("/faq/")
      ? "FAQ"
      : "";

    const image = frontMatter.ogImage
      ? "https://bluewind.ai" + frontMatter.ogImage
      : `https://bluewind.ai/api/og?title=${encodeURIComponent(
          title
        )}&description=${encodeURIComponent(
          description
        )}&section=${encodeURIComponent(section)}`;

    const video = frontMatter.ogVideo
      ? "https://bluewind.ai" + frontMatter.ogVideo
      : null;

    return (
      <>
        <meta name="theme-color" content="#000" />
        <meta property="og:url" content={url} />
        <meta httpEquiv="Content-Language" content="en" />

        <meta name="description" content={description} />
        <meta property="og:description" content={description} />

        {video && <meta property="og:video" content={video} />}

        <meta property="og:image" content={image} />
        <meta property="twitter:image" content={image} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site:domain" content="bluewind.ai" />
        <meta name="twitter:url" content="https://bluewind.ai" />

        <style
          dangerouslySetInnerHTML={{
            __html: `html { --font-geist-sans: ${GeistSans.style.fontFamily}; }`,
          }}
        />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
      </>
    );
  },
  components: {
    Frame,
    Tabs,
    Tab,
    Steps,
    Card,
    Cards,
    AvailabilityBanner,
    Callout,
    CloudflareVideo,
    Video,
  },
  // banner: {
  //   key: "banner-hiring-june",
  //   dismissible: true,
  //   text: (
  //     <Link href="/careers">
  //       {/* mobile */}
  //       <span className="sm:hidden">Join us in Engineering & DevRel →</span>
  //       {/* desktop */}
  //       <span className="hidden sm:inline">
  //         We're hiring. Join us in Product Eng, Backend Eng, and DevRel →
  //       </span>
  //     </Link>
  //   ),
  // },
};

export default config;
