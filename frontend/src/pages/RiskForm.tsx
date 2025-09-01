import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRisk, getRisk, updateRisk } from "../services/risks";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";

const schema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  severity: z.number().min(1).max(5),
  probability: z.number().min(1).max(5),
  status: z.enum(["open", "mitigated", "closed"]).default("open"),
});

type FormData = z.infer<typeof schema>;

export default function RiskForm() {
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = Boolean(params.id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { severity: 3, probability: 3, status: "open" },
  });

  useEffect(() => {
    async function load() {
      if (params.id) {
        const r = await getRisk(Number(params.id));
        reset({
          title: r.title,
          description: r.description ?? "",
          severity: r.severity,
          probability: r.probability,
          status: r.status,
        });
      }
    }
    load();
  }, [params.id, reset]);

  async function onSubmit(values: FormData) {
    if (isEdit && params.id) {
      await updateRisk(Number(params.id), values);
    } else {
      await createRisk(values);
    }
    navigate("/risks");
  }

  return (
    <div style={{ maxWidth: 480, margin: "20px auto" }}>
      <h1>{isEdit ? "Edit risk" : "Create risk"}</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Title</label>
          <input type="text" {...register("title")} />
          {errors.title && <p>{errors.title.message}</p>}
        </div>
        <div>
          <label>Description</label>
          <textarea {...register("description")} />
        </div>
        <div>
          <label>Severity (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            {...register("severity", { valueAsNumber: true })}
          />
          {errors.severity && <p>{errors.severity.message}</p>}
        </div>
        <div>
          <label>Probability (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            {...register("probability", { valueAsNumber: true })}
          />
          {errors.probability && <p>{errors.probability.message}</p>}
        </div>
        <div>
          <label>Status</label>
          <select {...register("status")}>
            <option value="open">Open</option>
            <option value="mitigated">Mitigated</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button disabled={isSubmitting} type="submit">
          {isEdit ? "Save" : "Create"}
        </button>
      </form>
    </div>
  );
}
