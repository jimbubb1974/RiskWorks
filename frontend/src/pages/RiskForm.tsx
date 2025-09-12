import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRisk, getRisk, updateRisk } from "../services/risks";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listRBSTree, type RBSNode } from "../services/rbs";
import {
  Save,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Target,
  BarChart3,
  FileText,
  Info,
  TrendingUp,
} from "lucide-react";

const schema = z.object({
  risk_name: z
    .string()
    .min(1, "Risk name is required")
    .max(255, "Risk name must be less than 255 characters"),
  risk_description: z.string().optional(),
  probability: z
    .number()
    .min(1, "Probability must be between 1-5")
    .max(5, "Probability must be between 1-5"),
  impact: z
    .number()
    .min(1, "Impact must be between 1-5")
    .max(5, "Impact must be between 1-5"),
  category: z.string().optional(),
  risk_owner: z.string().optional(),
  rbs_node_id: z.number().int().nullable().optional(),
  latest_reviewed_date: z.string().optional(),
  probability_basis: z.string().optional(),
  impact_basis: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["open", "closed", "draft"]),
});

type FormData = z.infer<typeof schema>;

export default function RiskForm() {
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(params.id);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      risk_name: "",
      risk_description: "",
      probability: 3,
      impact: 3,
      category: "operational",
      risk_owner: "Unassigned",
      rbs_node_id: null,
      latest_reviewed_date: "",
      probability_basis: "",
      impact_basis: "",
      notes: "",
      status: "open",
    },
  });

  const probability = watch("probability");
  const impact = watch("impact");
  const riskScore = probability * impact;

  // Ensure RHF knows about rbs_node_id when using setValue on a controlled select
  useEffect(() => {
    register("rbs_node_id" as any);
  }, [register]);

  // RBS tree helpers
  const { data: rbsTree = [] } = useQuery({
    queryKey: ["rbs-tree"],
    queryFn: listRBSTree,
  });

  function flattenRBSTree(
    nodes: (RBSNode & { children?: RBSNode[] })[],
    depth = 0
  ): { id: number; label: string }[] {
    const rows: { id: number; label: string }[] = [];
    for (const n of nodes) {
      const indent = "\u00A0\u00A0".repeat(depth); // non-breaking spaces so indentation renders in <option>
      const marker = depth > 0 ? "↳ " : "";
      rows.push({ id: n.id, label: `${indent}${marker}${n.name}` });
      if (n.children && n.children.length)
        rows.push(...flattenRBSTree(n.children, depth + 1));
    }
    return rows;
  }

  useEffect(() => {
    async function load() {
      if (params.id) {
        setIsLoading(true);
        try {
          const r = await getRisk(Number(params.id));
          reset({
            risk_name: r.risk_name,
            risk_description: r.risk_description ?? "",
            probability: r.probability,
            impact: r.impact,
            category: r.category ?? "operational",
            risk_owner: r.risk_owner ?? "Unassigned",
            rbs_node_id: (r as any).rbs_node_id ?? null,
            latest_reviewed_date: r.latest_reviewed_date ?? "",
            probability_basis: r.probability_basis ?? "",
            impact_basis: r.impact_basis ?? "",
            notes: r.notes ?? "",
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
      // Convert empty strings to null for optional fields
      const normalizedRbsId =
        values.rbs_node_id === undefined ||
        Number.isNaN(values.rbs_node_id as any)
          ? null
          : values.rbs_node_id;
      const cleanedValues = {
        ...values,
        risk_description: values.risk_description || null,
        latest_reviewed_date: values.latest_reviewed_date || null,
        probability_basis: values.probability_basis || null,
        impact_basis: values.impact_basis || null,
        notes: values.notes || null,
        rbs_node_id: normalizedRbsId,
      };

      if (isEdit && params.id) {
        await updateRisk(Number(params.id), cleanedValues);
        // Invalidate risks cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ["risks"] });
      } else {
        await createRisk(cleanedValues);
        // Invalidate risks cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ["risks"] });
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
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-accent-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/risks" className="btn-secondary group">
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Risks
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-secondary-900">
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Basic Information
                </h3>
                <div className="space-y-4">
                  {/* Risk Name */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Risk Name *
                    </label>
                    <input
                      type="text"
                      {...register("risk_name")}
                      className="input"
                      placeholder="e.g., Data breach from unsecured API endpoints"
                    />
                    {errors.risk_name && (
                      <p className="text-sm text-danger-600 mt-1 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.risk_name.message}
                      </p>
                    )}
                  </div>

                  {/* Risk Description */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Risk Description
                    </label>
                    <textarea
                      {...register("risk_description")}
                      rows={4}
                      className="input resize-none"
                      placeholder="Provide additional context, potential impact, and relevant details about this risk..."
                    />
                  </div>

                  {/* Category, RBS link, and Risk Owner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Risk Category
                      </label>
                      <select {...register("category")} className="input">
                        <option value="operational">Operational</option>
                        <option value="financial">Financial</option>
                        <option value="strategic">Strategic</option>
                        <option value="technical">Technical</option>
                        <option value="compliance">Compliance</option>
                        <option value="security">Security</option>
                        <option value="environmental">Environmental</option>
                        <option value="reputational">Reputational</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        RBS Category (any level)
                      </label>
                      <select
                        className="input"
                        value={(watch("rbs_node_id") as any) ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed = raw === "" ? undefined : Number(raw);

                          setValue("rbs_node_id" as any, parsed as any, {
                            shouldDirty: true,
                          });
                        }}
                      >
                        <option value="">No RBS link</option>
                        {flattenRBSTree(rbsTree as any, 0).map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Risk Owner
                      </label>
                      <input
                        type="text"
                        {...register("risk_owner")}
                        className="input"
                        placeholder="e.g., John Smith"
                      />
                    </div>
                  </div>

                  {/* Latest Reviewed Date */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Latest Reviewed Date
                    </label>
                    <input
                      type="date"
                      {...register("latest_reviewed_date")}
                      className="input"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Current Status
                    </label>
                    <select {...register("status")} className="input">
                      <option value="open">Open - Requires attention</option>
                      <option value="closed">Closed - Risk resolved</option>
                      <option value="draft">Draft - Under review</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Risk Assessment */}
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  Risk Assessment
                </h3>
                <div className="space-y-4">
                  {/* Probability */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      <BarChart3 className="w-4 h-4 inline mr-2" />
                      Probability (1-5)
                    </label>
                    <select
                      {...register("probability", { valueAsNumber: true })}
                      className="input"
                    >
                      <option value={1}>1 - Very Unlikely</option>
                      <option value={2}>2 - Unlikely</option>
                      <option value={3}>3 - Possible</option>
                      <option value={4}>4 - Likely</option>
                      <option value={5}>5 - Very Likely</option>
                    </select>
                    {errors.probability && (
                      <p className="text-sm text-danger-600 mt-1 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.probability.message}
                      </p>
                    )}
                  </div>

                  {/* Impact */}
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

                  {/* Risk Score Display */}
                  <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
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
                      <p className="text-sm text-secondary-600 mt-2">
                        Risk Score
                      </p>
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
                          ? "Critical Risk"
                          : riskScore >= 9
                          ? "High Risk"
                          : riskScore >= 4
                          ? "Medium Risk"
                          : "Low Risk"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Probability Basis */}
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-warning-600" />
                  Probability Basis
                </h3>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Justification for Probability Rating
                  </label>
                  <textarea
                    {...register("probability_basis")}
                    rows={4}
                    className="input resize-none"
                    placeholder="Justify the probability rating with supporting evidence, historical data, or expert opinion..."
                  />
                </div>
              </div>

              {/* Impact Basis */}
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-danger-600" />
                  Impact Basis
                </h3>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Justification for Impact Rating
                  </label>
                  <textarea
                    {...register("impact_basis")}
                    rows={4}
                    className="input resize-none"
                    placeholder="Justify the impact rating with potential consequences, financial implications, or operational effects..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes - Full Width */}
          <div className="card-glass">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary-600" />
              Notes
            </h3>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Additional Notes and Comments
              </label>
              <textarea
                {...register("notes")}
                rows={4}
                className="input resize-none"
                placeholder="Add any additional notes, comments, or observations about this risk..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-6">
            <Link to="/risks" className="btn-secondary">
              Cancel
            </Link>
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
          </div>
        </form>
      </div>
    </div>
  );
}
