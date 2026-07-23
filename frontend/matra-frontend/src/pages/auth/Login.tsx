import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

function Login() {
  return (
    <Card>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600">
          Matra
        </h1>

        <p className="mt-2 text-slate-500">
          Sign in to continue
        </p>
      </div>

      <form className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
        />

        <Button
          type="submit"
          className="w-full"
        >
          Login
        </Button>

        <p className="text-center text-sm">
          <button
            type="button"
            className="text-blue-600 hover:underline"
          >
            Forgot your password?
          </button>
        </p>
      </form>
    </Card>
  );
}

export default Login;
