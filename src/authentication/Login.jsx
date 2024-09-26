import { useForm } from "react-hook-form";
import { useLogin } from "./useLogin";
import { Input } from "../shadcn/input";
import { Label } from "../shadcn/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../shadcn/dialog";
import { Button } from "../shadcn/button";

export default function Login() {
  const { login, isLoading, isError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login({ email: data.email, password: data.password });
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold">Login</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Enter your account information to access your dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-destructive text-sm font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password", { required: "Password is required" })}
                className="w-full"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-destructive text-sm font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>
          {isError && (
            <p className="text-destructive text-sm font-medium">
              Invalid login credentials. Please try again.
            </p>
          )}
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="mt-3 sm:mt-0">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
