import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import { register, type RegisterPayload } from "@/api/api";
import { Link, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const registerschema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(6, { message: "Minimum of 6 characters is required." }),
  full_name: z
    .string()
    .min(4, { message: "Minimum of four characters is required." }),
});

const RegisterForm = ({ className, ...props }: ComponentProps<"form">) => {
  const navigate = useNavigate();
  const form = useForm<RegisterPayload>({
    resolver: zodResolver(registerschema),
  });
  const {
    formState: { isSubmitting, errors },
    setError,
  } = form;

  const { mutate } = useMutation({
    mutationKey: ["register"],
    mutationFn: register,
    onSuccess: () => {
      navigate("/login");
    },
    onError: (error: any) => {
      setError("root", error.data, { shouldFocus: true });
      console.log("error", error);
    },
  });

  const onSubmit: SubmitHandler<RegisterPayload> = (
    data: z.infer<typeof registerschema>
  ) => mutate(data);
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your details below to create an account
          </p>
        </div>

        {errors && (
          <div className="text-red-500 text-sm text-center">
            {errors.root?.message}
          </div>
        )}

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    type="etext"
                    placeholder="Enter your name."
                    value={field.value}
                    onChange={field.onChange}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email."
                    value={field.value}
                    onChange={field.onChange}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter a strong password."
                    value={field.value}
                    onChange={field.onChange}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "loading..." : "Register"}
        </Button>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Login
        </Link>
      </div>
    </Form>
  );
};

export default RegisterForm;
