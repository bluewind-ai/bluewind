import { Background } from "./Background";
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { Header } from "./Header";
import { ProductUpdateSignup } from "./productUpdateSignup";

export function Waitlist() {
  return (
    <section className="flex flex-col gap-10 w-full min-h-screen items-center py-20">
      <Header
        title="Sign up for the waitlist"
        description="Learn more about Bluewind"
        h="h1"
        buttons={[]}
      />
      <ProductUpdateSignup />
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
