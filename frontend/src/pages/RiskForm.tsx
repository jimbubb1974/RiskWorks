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
  status: z.enum(["open", "mitigated", "closed"]),
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
    defaultValues: {
      title: "",
      description: "",
      severity: 3,
      probability: 3,
      status: "open",
    },
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
    <div className="max-w-md mx-auto">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">
        {isEdit ? "Edit risk" : "Create risk"}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Title</label>
          <input
            type="text"
            {...register("title")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">
            Description
          </label>
          <textarea
            {...register("description")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              Severity (1-5)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              {...register("severity", { valueAsNumber: true })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.severity && (
              <p className="text-sm text-red-600">{errors.severity.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              Probability (1-5)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              {...register("probability", { valueAsNumber: true })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.probability && (
              <p className="text-sm text-red-600">
                {errors.probability.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Status</label>
          <select
            {...register("status")}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="open">Open</option>
            <option value="mitigated">Mitigated</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button
          disabled={isSubmitting}
          type="submit"
          className="inline-flex items-center rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isEdit ? "Save" : "Create"}
        </button>
      </form>
    </div>
  );
}
