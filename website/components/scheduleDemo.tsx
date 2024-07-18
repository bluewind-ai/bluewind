import { Background } from "./Background";
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { Header } from "./Header";

export function ScheduleDemoPage() {
  return (
    <section className="flex flex-col gap-10 w-full min-h-screen items-center py-20">
      <Header
        title="Talk to us"
        description="Get updates about the product"
        h="h1"
        buttons={[
          {
            href: "/agencies",
            text: "Agencies FAQ",
          },
          {
            href: "/enterprise",
            text: "Enterprise FAQ",
          },
          {
            href: "/docs",
            text: "Why Bluewind",
          },
        ]}
      />
      <ScheduleDemo />
      <Background />
    </section>
  );
}

export function ScheduleDemo() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);
  return (
    <Cal
      calLink="wayne-hamadi-v6h0bk/15min"
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{ layout: "month_view" }}
    />
  );
}
