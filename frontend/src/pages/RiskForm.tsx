import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRisk, getRisk, updateRisk } from "../services/risks";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Save,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Target,
  BarChart3,
  FileText,
  Info,
} from "lucide-react";

const schema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  likelihood: z
    .number()
    .min(1, "Likelihood must be between 1-5")
    .max(5, "Likelihood must be between 1-5"),
  impact: z
    .number()
    .min(1, "Impact must be between 1-5")
    .max(5, "Impact must be between 1-5"),
  status: z.enum(["open", "in_progress", "mitigated", "closed", "escalated"]),
});

type FormData = z.infer<typeof schema>;

export default function RiskForm() {
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = Boolean(params.id);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      likelihood: 3,
      impact: 3,
      status: "open",
    },
  });

  const likelihood = watch("likelihood");
  const impact = watch("impact");
  const riskScore = likelihood * impact;

  useEffect(() => {
    async function load() {
      if (params.id) {
        setIsLoading(true);
        try {
          const r = await getRisk(Number(params.id));
          reset({
            title: r.title,
            description: r.description ?? "",
            likelihood: r.likelihood,
            impact: r.impact,
            status: r.status,
          });
        } catch (error) {
          console.error("Failed to load risk:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    load();
  }, [params.id, reset]);

  async function onSubmit(values: FormData) {
    try {
      if (isEdit && params.id) {
        await updateRisk(Number(params.id), values);
      } else {
        await createRisk(values);
      }
      navigate("/risks");
    } catch (error) {
      console.error("Failed to save risk:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-secondary-600">Loading risk...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/risks" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEdit ? "Edit Risk" : "Create New Risk"}
          </h1>
          <p className="text-secondary-600">
            {isEdit
              ? "Update risk assessment details"
              : "Add a new risk to your organization's registry"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Risk Title
              </label>
              <input
                type="text"
                {...register("title")}
                className="input"
                placeholder="e.g., Data breach from unsecured API endpoints"
              />
              {errors.title && (
                <p className="text-sm text-danger-600 mt-1 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="input resize-none"
                placeholder="Provide additional context, potential impact, and relevant details about this risk..."
              />
            </div>

            {/* Severity and Probability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Target className="w-4 h-4 inline mr-2" />
                  Impact (1-5)
                </label>
                <select
                  {...register("impact", { valueAsNumber: true })}
                  className="input"
                >
                  <option value={1}>1 - Minimal Impact</option>
                  <option value={2}>2 - Minor Impact</option>
                  <option value={3}>3 - Moderate Impact</option>
                  <option value={4}>4 - Major Impact</option>
                  <option value={5}>5 - Critical Impact</option>
                </select>
                {errors.impact && (
                  <p className="text-sm text-danger-600 mt-1 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.impact.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Likelihood (1-5)
                </label>
                <select
                  {...register("likelihood", { valueAsNumber: true })}
                  className="input"
                >
                  <option value={1}>1 - Very Unlikely</option>
                  <option value={2}>2 - Unlikely</option>
                  <option value={3}>3 - Possible</option>
                  <option value={4}>4 - Likely</option>
                  <option value={5}>5 - Very Likely</option>
                </select>
                {errors.likelihood && (
                  <p className="text-sm text-danger-600 mt-1 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.likelihood.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Current Status
              </label>
              <select {...register("status")} className="input">
                <option value="open">Open - Requires attention</option>
                <option value="mitigated">Mitigated - Risk reduced</option>
                <option value="closed">Closed - Risk resolved</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-4">
              <button
                disabled={isSubmitting}
                type="submit"
                className="btn-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isEdit ? "Updating..." : "Creating..."}
                  </div>
                ) : (
                  <>
                    {isEdit ? (
                      <Save className="w-5 h-5 mr-2" />
                    ) : (
                      <Plus className="w-5 h-5 mr-2" />
                    )}
                    {isEdit ? "Update Risk" : "Create Risk"}
                  </>
                )}
              </button>

              <Link to="/risks" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Risk Assessment Panel */}
        <div className="space-y-6">
          {/* Risk Score */}
          <div className="card">
            <h3 className="font-semibold text-secondary-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Risk Assessment
            </h3>

            <div className="space-y-4">
              <div className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl font-bold text-white ${
                    riskScore >= 16
                      ? "bg-danger-500"
                      : riskScore >= 9
                      ? "bg-warning-500"
                      : "bg-success-500"
                  }`}
                >
                  {riskScore}
                </div>
                <p className="text-sm text-secondary-600 mt-2">Risk Score</p>
                <p
                  className={`text-sm font-medium ${
                    riskScore >= 16
                      ? "text-danger-600"
                      : riskScore >= 9
                      ? "text-warning-600"
                      : "text-success-600"
                  }`}
                >
                  {riskScore >= 16
                    ? "High Risk"
                    : riskScore >= 9
                    ? "Medium Risk"
                    : "Low Risk"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Severity:</span>
                  <span className="font-medium">{severity}/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Probability:</span>
                  <span className="font-medium">{probability}/5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Guide */}
          <div className="card bg-primary-50 border-primary-200">
            <h4 className="font-medium text-primary-900 mb-3 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Assessment Guide
            </h4>
            <div className="text-sm text-primary-800 space-y-2">
              <div>
                <strong>Severity:</strong> The potential impact if the risk
                occurs
              </div>
              <div>
                <strong>Probability:</strong> The likelihood of the risk
                occurring
              </div>
              <div>
                <strong>Risk Score:</strong> Severity × Probability (1-25 scale)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
