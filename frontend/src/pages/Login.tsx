import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    await login(values.email, values.password);
    navigate("/dashboard");
  }

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Email</label>
          <input type="email" {...register("email")} />
          {errors.email && <p>{errors.email.message}</p>}
        </div>
        <div>
          <label>Password</label>
          <input type="password" {...register("password")} />
          {errors.password && <p>{errors.password.message}</p>}
        </div>
        <button disabled={isSubmitting} type="submit">
          Sign in
        </button>
      </form>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
