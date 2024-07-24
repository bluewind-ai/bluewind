"use client";

import { createClient } from "../utils/supabase/client";
import { Button } from "../components/ui/button";

export default function LoginButton(props: { nextUrl?: string }) {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${
          props.nextUrl || ""
        }`,
      },
    });
  };
  return <Button onClick={handleLogin}>Login With Google </Button>;
}
