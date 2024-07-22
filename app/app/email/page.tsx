"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Tables } from "../../types/supabase";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Message = Tables<"messages">;

const formSchema = z.object({
  subject: z.string().min(1, {
    message: "Subject line must be at least 1 characters.",
  }),
  body: z.string().min(1, {
    message: "Body must be at least 1 character.",
  }),
});

export default function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
    },
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const test = createClient();

  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await test.from("messages").select("*");
      console.log("data", data);
      console.log("error", error);
      if (error) {
        setError(error.message);
      } else {
        setMessages(data as Message[]);
      }
    }

    fetchMessages();
    // console.log(messages);
  }, []);

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }
  // const { data, error } = await supabase.from("messages").select("*");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 w-full max-w-4xl mx-auto"
      >
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Line</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter subject"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                {/* This is your public display name. */}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Type your message here"
                  {...field}
                  className="w-full"
                  style={{ minHeight: "200px" }}
                />
              </FormControl>
              <FormDescription>
                {/* This is your public display name. */}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
