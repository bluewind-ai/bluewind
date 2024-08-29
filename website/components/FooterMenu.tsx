import Link from "next/link";

const menuItems: {
  heading: string;
  items: { name: string; href: string; notificationCount?: number }[];
}[] = [
  {
    heading: "Products",
    items: [
      {
        name: "Shared Channel (Front)",
        href: "",
      },
      {
        name: "Data Labeler (Amazon Mechanical Turk)",
        href: "",
      },
      {
        name: "Data aggregator/enrichment (Clay)",
        href: "",
      },
      {
        name: "Sales Engagement (Outreach)",
        href: "",
      },
      {
        name: "Call transcription (Gong)",
        href: "",
      },
      {
        name: "Newsletter (Mailchimp)",
        href: "",
      },
      {
        name: "CRM (Salesforce Sales Cloud)",
        href: "",
      },
      {
        name: "Sales Intelligence (Gong)",
        href: "",
      },
      {
        name: "Quoting (CPQ)",
        href: "",
      },
      {
        name: "Knowledge Base (Notion)",
        href: "",
      },
      {
        name: "Customer Support (Front)",
        href: "",
      },
    ],
  },
  {
    heading: "Integrations",
    items: [
      {
        name: "Gmail",
        href: "",
      },
      {
        name: "Outlook",
        href: "",
      },
      {
        name: "Cloudflare",
        href: "",
      },
      {
        name: "Linkedin",
        href: "",
      },
      {
        name: "Whatsapp",
        href: "",
      },
      {
        name: "Slack",
        href: "",
      },
    ],
  },
  {
    heading: "Resources",
    items: [{ name: "Why Bluewind?", href: "/docs" }],
  },
  {
    heading: "About",
    items: [
      {
        name: "Talk to us",
        href: "/talk-to-us",
      },
      {
        name: "OSS Friends",
        href: "/oss-friends",
      },
    ],
  },

  {
    heading: "Legal",
    items: [
      {
        name: "Terms",
        href: "/terms",
      },
      {
        name: "Privacy Policy",
        href: "/privacy-policy",
      },
    ],
  },
];

const FooterMenu = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-5 text-base gap-y-8 gap-x-2">
        {menuItems.map((menu) => (
          <div key={menu.heading}>
            <p className="pb-4 font-mono font-bold text-primary">
              {menu.heading}
            </p>
            <ul className="flex flex-col gap-3 items-start">
              {menu.items.map((item) => (
                <li key={item.name} className="relative flex gap-1">
                  <Link
                    href={item.href}
                    className="text-sm hover:text-primary/80"
                  >
                    {item.name}
                  </Link>
                  {item.notificationCount > 0 && (
                    <span className="transform -translate-y-1/4 bg-primary text-primary-foreground rounded-full h-3 w-3 text-[0.6rem] flex items-center justify-center">
                      {item.notificationCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div />
      </div>
      <div className="my-8 font-mono text-sm">
        © 2024-{new Date().getFullYear()} Bluewind Inc.
      </div>
    </div>
  );
};

export default FooterMenu;
