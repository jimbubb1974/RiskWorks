import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Camera,
  History,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import RiskTrends from "../components/RiskTrends";
import type { Risk } from "../types/risk";
import type { ActionItem } from "../types/actionItem";
import type { Snapshot } from "../types/snapshot";
import { auditService } from "../services/audit";
import type { AuditLog } from "../services/audit";
import {
  api,
  createSnapshot,
  getSnapshots,
  deleteSnapshot,
  restoreSnapshot,
  exportSnapshot,
  importSnapshot,
} from "../services/api";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";

// Set up PDFMake fonts
pdfMake.vfs = pdfFonts;

// Utility function to create diff highlighting
const createDiffHighlight = (existingText: string, newText: string) => {
  if (!existingText && !newText) return null;
  if (!existingText) return { new: newText, changed: true };
  if (!newText) return { existing: existingText, changed: true };
  if (existingText === newText) return { text: existingText, changed: false };

  // Simple word-by-word comparison for highlighting changes
  const existingWords = existingText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  const result: Array<{ text: string; isChanged: boolean; isNew?: boolean }> =
    [];
  let existingIndex = 0;
  let newIndex = 0;

  while (existingIndex < existingWords.length || newIndex < newWords.length) {
    const existingWord = existingWords[existingIndex];
    const newWord = newWords[newIndex];

    if (existingWord === newWord) {
      // Words match, no change
      result.push({ text: existingWord, isChanged: false });
      existingIndex++;
      newIndex++;
    } else if (!existingWord) {
      // New word added
      result.push({ text: newWord, isChanged: true, isNew: true });
      newIndex++;
    } else if (!newWord) {
      // Word removed
      result.push({ text: existingWord, isChanged: true, isNew: false });
      existingIndex++;
    } else {
      // Word changed
      result.push({ text: existingWord, isChanged: true, isNew: false });
      result.push({ text: newWord, isChanged: true, isNew: true });
      existingIndex++;
      newIndex++;
    }
  }

  return result;
};

// Component to render existing data with highlighting for removed/changed parts
const ExistingDataText = ({
  existingText,
  newText,
  label,
}: {
  existingText: string;
  newText: string;
  label: string;
}) => {
  // If texts are the same, show normal text
  if (existingText === newText) {
    return (
      <p>
        <strong>{label}:</strong> {existingText}
      </p>
    );
  }

  // If existing text is empty, show nothing (it's being added)
  if (!existingText) {
    return (
      <p>
        <strong>{label}:</strong>{" "}
        <span className="text-gray-400 italic">(empty)</span>
      </p>
    );
  }

  // If new text is empty, existing text is being removed
  if (!newText) {
    return (
      <p>
        <strong>{label}:</strong>{" "}
        <span className="text-red-600 line-through bg-red-50 px-1 rounded">
          {existingText}
        </span>
      </p>
    );
  }

  // Show existing text with parts that will be removed/changed highlighted
  const diff = createDiffHighlight(existingText, newText);

  if (Array.isArray(diff)) {
    return (
      <p>
        <strong>{label}:</strong>{" "}
        {diff.map((part, index) => (
          <span
            key={index}
            className={
              part.isChanged && !part.isNew
                ? "text-red-600 line-through bg-red-50 px-1 rounded"
                : ""
            }
          >
            {part.text}
          </span>
        ))}
      </p>
    );
  }

  return (
    <p>
      <strong>{label}:</strong> {existingText}
    </p>
  );
};

// Component to render new data with highlighting for added/changed parts
const NewDataText = ({
  existingText,
  newText,
  label,
}: {
  existingText: string;
  newText: string;
  label: string;
}) => {
  // If texts are the same, show normal text
  if (existingText === newText) {
    return (
      <p>
        <strong>{label}:</strong> {newText}
      </p>
    );
  }

  // If new text is empty, show nothing (it's being removed)
  if (!newText) {
    return (
      <p>
        <strong>{label}:</strong>{" "}
        <span className="text-gray-400 italic">(empty)</span>
      </p>
    );
  }

  // If existing text is empty, new text is being added
  if (!existingText) {
    return (
      <p>
        <strong>{label}:</strong>{" "}
        <span className="text-red-600 font-medium bg-red-50 px-1 rounded">
          {newText}
        </span>
      </p>
    );
  }

  // Show new text with parts that are being added/changed highlighted
  const diff = createDiffHighlight(existingText, newText);

  if (Array.isArray(diff)) {
    return (
      <p>
        <strong>{label}:</strong>{" "}
        {diff.map((part, index) => (
          <span
            key={index}
            className={
              part.isChanged && part.isNew
                ? "text-red-600 font-medium bg-red-50 px-1 rounded"
                : ""
            }
          >
            {part.text}
          </span>
        ))}
      </p>
    );
  }

  return (
    <p>
      <strong>{label}:</strong> {newText}
    </p>
  );
};

// Helper function to get fields that have differences
const getFieldsWithDifferences = (existingRisk: any, excelRisk: any) => {
  const fieldsToCheck = [
    { key: "risk_name", label: "Name" },
    { key: "risk_description", label: "Description" },
    { key: "status", label: "Status" },
    { key: "probability", label: "Probability" },
    { key: "impact", label: "Impact" },
    { key: "risk_owner", label: "Risk Owner" },
    { key: "probability_basis", label: "Probability Basis" },
    { key: "impact_basis", label: "Impact Basis" },
    { key: "notes", label: "Notes" },
  ];

  return fieldsToCheck.filter((field) => {
    const existingValue = existingRisk[field.key];
    const excelValue = excelRisk[field.key];

    // Normalize values for comparison
    const normalizeValue = (val: any) => {
      if (val === null || val === undefined) return "";
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "" || isNaN(Number(trimmed))) {
          return trimmed;
        }
        return Number(trimmed);
      }
      return val;
    };

    const normalizedExisting = normalizeValue(existingValue);
    const normalizedExcel = normalizeValue(excelValue);

    return normalizedExisting !== normalizedExcel;
  });
};

export default function Reports() {
  const [selectedFormat, setSelectedFormat] = useState<
    "pdf" | "excel" | "word"
  >("pdf");
  const [selectedReportType, setSelectedReportType] = useState<
    "summary" | "risk-detail" | "audit-history"
  >("summary");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showRiskTrends, setShowRiskTrends] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [importConflicts, setImportConflicts] = useState<{
    conflicts: Array<{
      excelRisk: any;
      existingRisk: any;
      conflictType: "id_exists" | "name_exists" | "both";
    }>;
    newRisks: any[];
    newActionItems: any[];
    showConflictResolution: boolean;
  }>({
    conflicts: [],
    newRisks: [],
    newActionItems: [],
    showConflictResolution: false,
  });
  const [conflictResolutions, setConflictResolutions] = useState<{
    [key: number]: "keep_existing" | "replace_with_excel" | null;
  }>({});
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotDescription, setSnapshotDescription] = useState("");
  const [showCreateSnapshot, setShowCreateSnapshot] = useState(false);
  const [snapshotStatus, setSnapshotStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [snapshotImportFile, setSnapshotImportFile] = useState<File | null>(
    null
  );
  const [snapshotsExpanded, setSnapshotsExpanded] = useState(false);

  // Handle individual conflict resolution
  const handleConflictResolution = (
    conflictIndex: number,
    resolution: "keep_existing" | "replace_with_excel"
  ) => {
    setConflictResolutions((prev) => ({
      ...prev,
      [conflictIndex]: resolution,
    }));
  };

  // Check if all conflicts are resolved
  const allConflictsResolved = importConflicts.conflicts.every(
    (_, index) =>
      conflictResolutions[index] !== null &&
      conflictResolutions[index] !== undefined
  );

  // Apply individual conflict resolutions
  const applyIndividualResolutions = () => {
    const resolvedConflicts = importConflicts.conflicts
      .map((conflict, index) => {
        const resolution = conflictResolutions[index];
        if (resolution === "keep_existing") {
          // Keep existing - create new risk with Excel data but without ID
          return {
            ...conflict.excelRisk,
            id: undefined,
          };
        } else if (resolution === "replace_with_excel") {
          // Replace with Excel data
          return conflict.excelRisk;
        }
        return null;
      })
      .filter(Boolean);

    executeImport(
      importConflicts.newRisks,
      resolvedConflicts,
      importConflicts.newActionItems
    );
  };

  // Reset conflict resolutions when starting new import
  const resetConflictResolutions = () => {
    setConflictResolutions({});
  };

  const {
    data: risks,
    isLoading,
    error: risksError,
  } = useQuery({
    queryKey: ["risks"],
    queryFn: () => api.get<Risk[]>("/risks").then((res) => res.data),
  });

  const { data: actionItems, isLoading: actionItemsLoading } = useQuery({
    queryKey: ["action-items"],
    queryFn: () =>
      api.get<ActionItem[]>("/action-items/").then((res) => res.data),
  });

  // Fetch audit logs for audit history report
  const { data: auditLogs = [], isLoading: auditLogsLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => auditService.getAuditLogs({ limit: 1000 }),
    enabled: selectedReportType === "audit-history",
  });

  const {
    data: snapshots,
    isLoading: snapshotsLoading,
    refetch: refetchSnapshots,
  } = useQuery({
    queryKey: ["snapshots"],
    queryFn: getSnapshots,
  });

  const filteredRisks =
    risks?.filter((risk) => {
      if (selectedStatus !== "all" && risk.status !== selectedStatus)
        return false;
      return true;
    }) || [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        setImportFile(file);
        setImportStatus({ type: null, message: "" });
      } else {
        setImportStatus({
          type: "error",
          message: "Please select a valid Excel file (.xlsx or .xls)",
        });
      }
    }
  };

  const analyzeExcelConflicts = async () => {
    if (!importFile) {
      setImportStatus({
        type: "error",
        message: "Please select a file first",
      });
      return;
    }

    // Reset conflict resolutions for new import
    resetConflictResolutions();

    try {
      setImportStatus({ type: "info", message: "Creating backup snapshot..." });

      // Auto-create snapshot before import
      const timestamp = new Date().toISOString().split("T")[0];
      const autoSnapshotName = `Auto-backup before import - ${timestamp}`;

      try {
        await createSnapshot({
          name: autoSnapshotName,
          description: `Automatic backup created before importing Excel file: ${importFile.name}`,
        });
        setImportStatus({
          type: "info",
          message: "Backup created. Processing file...",
        });
      } catch (snapshotError) {
        console.warn("Failed to create auto-snapshot:", snapshotError);
        setImportStatus({
          type: "info",
          message: "Processing file (backup failed)...",
        });
      }

      const arrayBuffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // Look for the "Risks" worksheet
      const risksSheet = workbook.Sheets["Risks"];
      if (!risksSheet) {
        setImportStatus({
          type: "error",
          message: "No 'Risks' worksheet found in the Excel file",
        });
        return;
      }

      // Look for the "Action Items" worksheet (optional)
      const actionItemsSheet = workbook.Sheets["Action Items"];

      // Convert to JSON
      const risksJsonData = XLSX.utils.sheet_to_json(risksSheet, { header: 1 });
      const actionItemsJsonData = actionItemsSheet
        ? XLSX.utils.sheet_to_json(actionItemsSheet, { header: 1 })
        : [];

      if (risksJsonData.length < 2) {
        setImportStatus({
          type: "error",
          message:
            "Excel file must contain at least a header row and one data row in the Risks worksheet",
        });
        return;
      }

      // Get headers (first row)
      const risksHeaders = risksJsonData[0] as string[];
      const risksDataRows = risksJsonData.slice(1) as any[][];

      // Map Excel columns to risk fields
      const riskData = risksDataRows
        .map((row, index) => {
          const risk: Partial<Risk> = {};

          risksHeaders.forEach((header, colIndex) => {
            const value = row[colIndex];
            if (value !== undefined && value !== null && value !== "") {
              switch (header.toLowerCase()) {
                case "risk id":
                  risk.id = typeof value === "number" ? value : parseInt(value);
                  break;
                case "title":
                case "risk name":
                case "title/risk name":
                  risk.risk_name = String(value);
                  break;
                case "description":
                  risk.risk_description = String(value);
                  break;
                case "status":
                  risk.status = String(value).toLowerCase().replace(" ", "_");
                  break;
                case "risk level":
                  risk.risk_level = String(value);
                  break;
                case "probability":
                  risk.probability =
                    typeof value === "number" ? value : parseInt(value);
                  break;
                case "impact":
                  risk.impact =
                    typeof value === "number" ? value : parseInt(value);
                  break;
                case "risk score":
                  // Skip - this is calculated from probability * impact
                  break;
                case "risk owner":
                  risk.risk_owner = String(value);
                  break;
                case "probability basis":
                  risk.probability_basis = String(value);
                  break;
                case "impact basis":
                  risk.impact_basis = String(value);
                  break;
                case "notes":
                  risk.notes = String(value);
                  break;
                case "latest reviewed date":
                  if (value instanceof Date) {
                    risk.latest_reviewed_date = value.toISOString();
                  } else if (typeof value === "string") {
                    risk.latest_reviewed_date = new Date(value).toISOString();
                  }
                  break;
              }
            }
          });

          // Set required fields with defaults if missing
          risk.owner_id = risk.owner_id || 1; // Default to user ID 1
          risk.probability = risk.probability || 1;
          risk.impact = risk.impact || 1;
          risk.status = risk.status || "open";
          risk.risk_level = risk.risk_level || "Low";

          return risk;
        })
        .filter((risk) => risk.risk_name); // Only include risks with names

      if (riskData.length === 0) {
        setImportStatus({
          type: "error",
          message: "No valid risk data found in the Excel file",
        });
        return;
      }

      // Process action items if worksheet exists
      let actionItemsData: any[] = [];
      if (actionItemsJsonData.length >= 2) {
        const actionItemsHeaders = actionItemsJsonData[0] as string[];
        const actionItemsDataRows = actionItemsJsonData.slice(1) as any[][];

        actionItemsData = actionItemsDataRows
          .map((row, index) => {
            const actionItem: Partial<any> = {};

            actionItemsHeaders.forEach((header, colIndex) => {
              const value = row[colIndex];
              if (value !== undefined && value !== null && value !== "") {
                switch (header.toLowerCase()) {
                  case "id":
                    actionItem.id =
                      typeof value === "number" ? value : parseInt(value);
                    break;
                  case "title":
                    actionItem.title = String(value);
                    break;
                  case "description":
                    actionItem.description = String(value);
                    break;
                  case "action type":
                    actionItem.action_type = String(value);
                    break;
                  case "priority":
                    actionItem.priority = String(value);
                    break;
                  case "status":
                    actionItem.status = String(value);
                    break;
                  case "risk id":
                    actionItem.risk_id =
                      typeof value === "number" ? value : parseInt(value);
                    break;
                  case "due date":
                    if (value instanceof Date) {
                      actionItem.due_date = value.toISOString();
                    } else if (typeof value === "string") {
                      actionItem.due_date = new Date(value).toISOString();
                    }
                    break;
                  case "progress percentage":
                    actionItem.progress_percentage =
                      typeof value === "number" ? value : parseInt(value);
                    break;
                }
              }
            });

            // Set required fields with defaults if missing
            actionItem.action_type = actionItem.action_type || "mitigation";
            actionItem.priority = actionItem.priority || "medium";
            actionItem.status = actionItem.status || "pending";
            actionItem.progress_percentage =
              actionItem.progress_percentage || 0;

            return actionItem;
          })
          .filter((actionItem) => actionItem.title); // Only include action items with titles
      }

      // Helper function to compare risk data
      const isRiskDataDifferent = (
        excelRisk: any,
        existingRisk: any
      ): boolean => {
        // Compare key fields that matter for conflicts
        const fieldsToCompare = [
          "risk_name",
          "risk_description",
          "status",
          "probability",
          "impact",
          "risk_owner",
          "probability_basis",
          "impact_basis",
          "notes",
        ];

        for (const field of fieldsToCompare) {
          const excelValue = excelRisk[field];
          const existingValue = existingRisk[field];

          // Normalize values for comparison
          const normalizeValue = (val: any) => {
            if (val === null || val === undefined) return "";
            if (typeof val === "string") {
              const trimmed = val.trim();
              // Convert string numbers to actual numbers for comparison
              if (trimmed === "" || isNaN(Number(trimmed))) {
                return trimmed;
              }
              return Number(trimmed);
            }
            return val;
          };

          const normalizedExcel = normalizeValue(excelValue);
          const normalizedExisting = normalizeValue(existingValue);

          if (normalizedExcel !== normalizedExisting) {
            console.log(`Field '${field}' differs:`, {
              excel: normalizedExcel,
              existing: normalizedExisting,
            });
            return true;
          }
        }

        return false;
      };

      // Analyze conflicts with existing risks
      const conflicts: Array<{
        excelRisk: any;
        existingRisk: any;
        conflictType: "id_exists" | "name_exists" | "both";
      }> = [];
      const newRisks: any[] = [];

      for (const excelRisk of riskData) {
        let hasConflict = false;
        let conflictType: "id_exists" | "name_exists" | "both" = "id_exists";
        let existingRisk = null;
        let riskExists = false;

        // Check for ID conflict
        if (excelRisk.id) {
          const idConflict = risks?.find((r) => r.id === excelRisk.id);
          if (idConflict) {
            riskExists = true;
            // Only flag as conflict if data is actually different
            const isDataDifferent = isRiskDataDifferent(excelRisk, idConflict);
            if (isDataDifferent) {
              hasConflict = true;
              existingRisk = idConflict;
              conflictType = "id_exists";
            }
          }
        }

        // Check for name conflict (if no ID conflict or ID not provided)
        if (!riskExists || !excelRisk.id) {
          const nameConflict = risks?.find(
            (r) =>
              r.risk_name?.toLowerCase() === excelRisk.risk_name?.toLowerCase()
          );
          if (nameConflict) {
            riskExists = true;
            // Only flag as conflict if data is actually different
            const isDataDifferent = isRiskDataDifferent(
              excelRisk,
              nameConflict
            );
            if (isDataDifferent) {
              if (hasConflict) {
                conflictType = "both";
              } else {
                hasConflict = true;
                conflictType = "name_exists";
              }
              existingRisk = nameConflict;
            }
          }
        }

        if (hasConflict) {
          conflicts.push({
            excelRisk,
            existingRisk,
            conflictType,
          });
        } else if (!riskExists) {
          // Only add to newRisks if the risk doesn't already exist
          newRisks.push(excelRisk);
        }
        // If riskExists but no conflict, skip it entirely (identical data)
      }

      // Analyze action items for duplicates
      const newActionItems: any[] = [];
      for (const excelActionItem of actionItemsData) {
        let actionItemExists = false;

        // Check if action item already exists by ID
        if (excelActionItem.id) {
          const existingActionItem = actionItems?.find(
            (ai) => ai.id === excelActionItem.id
          );
          if (existingActionItem) {
            actionItemExists = true;
            // Skip if identical (no conflict detection for action items for now)
            // Could add conflict detection here if needed
          }
        }

        // Check if action item exists by title and risk_id combination
        if (!actionItemExists) {
          const existingActionItem = actionItems?.find(
            (ai) =>
              ai.title?.toLowerCase() ===
                excelActionItem.title?.toLowerCase() &&
              ai.risk_id === excelActionItem.risk_id
          );
          if (existingActionItem) {
            actionItemExists = true;
          }
        }

        // Only add to newActionItems if it doesn't already exist
        if (!actionItemExists) {
          newActionItems.push(excelActionItem);
        }
      }

      // Show conflict resolution UI if there are conflicts
      if (conflicts.length > 0) {
        setImportConflicts({
          conflicts,
          newRisks,
          newActionItems,
          showConflictResolution: true,
        });
        setImportStatus({
          type: "info",
          message: `Found ${conflicts.length} conflicts, ${newRisks.length} new risks, and ${newActionItems.length} new action items. Please review conflicts below.`,
        });
      } else {
        // No conflicts, proceed with import
        await executeImport(newRisks, [], newActionItems);
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({
        type: "error",
        message: `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  const executeImport = async (
    newRisks: any[],
    resolvedConflicts: any[],
    actionItems: any[] = []
  ) => {
    try {
      setImportStatus({ type: "info", message: "Creating backup snapshot..." });

      // Auto-create snapshot before import
      const timestamp = new Date().toISOString().split("T")[0];
      const autoSnapshotName = `Auto-backup before import - ${timestamp}`;

      try {
        await createSnapshot({
          name: autoSnapshotName,
          description: `Automatic backup created before importing Excel file: ${importFile?.name}`,
        });
        setImportStatus({
          type: "info",
          message: "Backup created. Importing risks...",
        });
      } catch (snapshotError) {
        console.warn("Failed to create auto-snapshot:", snapshotError);
        setImportStatus({
          type: "info",
          message: "Importing risks (backup failed)...",
        });
      }

      const allRisksToImport = [...newRisks, ...resolvedConflicts];

      if (allRisksToImport.length === 0 && actionItems.length === 0) {
        setImportStatus({
          type: "info",
          message: "No data to import.",
        });
        return;
      }

      // Send to backend
      setImportStatus({
        type: "info",
        message: `Importing ${allRisksToImport.length} risks and ${actionItems.length} action items...`,
      });

      // Import risks (remove id field to let database auto-generate)
      const riskImportPromises = allRisksToImport.map((risk) => {
        const { id, ...riskWithoutId } = risk;
        return api.post("/risks", riskWithoutId).catch((error) => {
          console.error("Error importing risk:", error);
          return { error: error.message, risk };
        });
      });

      // Import action items (remove id field to let database auto-generate)
      const actionItemImportPromises = actionItems.map((actionItem) => {
        const { id, ...actionItemWithoutId } = actionItem;
        return api
          .post("/action-items/", actionItemWithoutId)
          .catch((error) => {
            console.error("Error importing action item:", error);
            return { error: error.message, actionItem };
          });
      });

      const [riskResults, actionItemResults] = await Promise.all([
        Promise.all(riskImportPromises),
        Promise.all(actionItemImportPromises),
      ]);

      const successfulRisks = riskResults.filter(
        (result) => !result.error
      ).length;
      const failedRisks = riskResults.filter((result) => result.error).length;
      const successfulActionItems = actionItemResults.filter(
        (result) => !result.error
      ).length;
      const failedActionItems = actionItemResults.filter(
        (result) => result.error
      ).length;

      if (failedRisks === 0 && failedActionItems === 0) {
        setImportStatus({
          type: "success",
          message: `Successfully imported ${successfulRisks} risks and ${successfulActionItems} action items!`,
        });
        // Refresh snapshots to show the auto-backup
        refetchSnapshots();
        // Refresh the risks data
        window.location.reload();
      } else {
        setImportStatus({
          type: "error",
          message: `Imported ${successfulRisks} risks (${failedRisks} failed) and ${successfulActionItems} action items (${failedActionItems} failed). Check console for details.`,
        });
        // Still refresh snapshots to show the auto-backup
        refetchSnapshots();
      }

      // Clear the file input and reset state
      setImportFile(null);
      setImportConflicts({
        conflicts: [],
        newRisks: [],
        newActionItems: [],
        showConflictResolution: false,
      });
      const fileInput = document.getElementById(
        "import-file"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({
        type: "error",
        message: `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  const createNewSnapshot = async () => {
    if (!snapshotName.trim()) {
      setSnapshotStatus({
        type: "error",
        message: "Please enter a snapshot name",
      });
      return;
    }

    try {
      setSnapshotStatus({ type: "info", message: "Creating snapshot..." });

      await createSnapshot({
        name: snapshotName.trim(),
        description: snapshotDescription.trim() || undefined,
      });

      setSnapshotStatus({
        type: "success",
        message: "Snapshot created successfully!",
      });

      // Clear form
      setSnapshotName("");
      setSnapshotDescription("");
      setShowCreateSnapshot(false);

      // Refresh snapshots
      refetchSnapshots();
    } catch (error) {
      console.error("Snapshot creation error:", error);
      setSnapshotStatus({
        type: "error",
        message: `Failed to create snapshot: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  const handleDeleteSnapshot = async (snapshotId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this snapshot? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteSnapshot(snapshotId);
      setSnapshotStatus({
        type: "success",
        message: "Snapshot deleted successfully!",
      });
      refetchSnapshots();
    } catch (error) {
      console.error("Snapshot deletion error:", error);
      setSnapshotStatus({
        type: "error",
        message: `Failed to delete snapshot: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  const handleRestoreSnapshot = async (snapshotId: number) => {
    if (
      !confirm(
        "Are you sure you want to restore this snapshot? This will replace ALL current risk and action item data. This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setSnapshotStatus({ type: "info", message: "Restoring snapshot..." });

      const result = await restoreSnapshot(snapshotId, true);

      if (result.success) {
        setSnapshotStatus({
          type: "success",
          message: result.message,
        });
        // Refresh all data
        window.location.reload();
      } else {
        setSnapshotStatus({
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Snapshot restore error:", error);
      setSnapshotStatus({
        type: "error",
        message: `Failed to restore snapshot: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  const handleExportSnapshot = async (
    snapshotId: number,
    snapshotName: string
  ) => {
    try {
      setSnapshotStatus({ type: "info", message: "Exporting snapshot..." });

      const blob = await exportSnapshot(snapshotId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Create filename
      const safeName = snapshotName.replace(/[^a-zA-Z0-9\s-_]/g, "");
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:.]/g, "-");
      link.download = `RiskWorks_Snapshot_${safeName}_${timestamp}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnapshotStatus({
        type: "success",
        message: "Snapshot exported successfully!",
      });
    } catch (error) {
      console.error("Snapshot export error:", error);
      setSnapshotStatus({
        type: "error",
        message: "Failed to export snapshot. Please try again.",
      });
    }
  };

  const handleSnapshotFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log(
        "File selected:",
        file.name,
        "type:",
        file.type,
        "size:",
        file.size
      );
      if (
        file.type === "application/json" ||
        file.name.endsWith(".json") ||
        file.type === ""
      ) {
        setSnapshotImportFile(file);
        setSnapshotStatus({
          type: "info",
          message: `Selected file: ${file.name}`,
        });
      } else {
        setSnapshotStatus({
          type: "error",
          message: "Please select a JSON file exported from RiskWorks.",
        });
      }
    }
  };

  const handleImportSnapshot = async () => {
    if (!snapshotImportFile) {
      setSnapshotStatus({
        type: "error",
        message: "Please select a snapshot file to import.",
      });
      return;
    }

    try {
      setSnapshotStatus({ type: "info", message: "Importing snapshot..." });

      const result = await importSnapshot(snapshotImportFile);

      if (result.success) {
        setSnapshotStatus({
          type: "success",
          message: result.message,
        });
        // Clear the file input
        setSnapshotImportFile(null);
        const fileInput = document.getElementById(
          "snapshot-import-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        // Refresh snapshots list
        refetchSnapshots();
      } else {
        setSnapshotStatus({
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Snapshot import error:", error);
      setSnapshotStatus({
        type: "error",
        message: "Failed to import snapshot. Please check the file format.",
      });
    }
  };

  const generateExport = () => {
    if (selectedReportType === "audit-history") {
      if (!auditLogs.length) return;
      if (selectedFormat === "excel") {
        generateAuditExcel();
      } else if (selectedFormat === "word") {
        generateAuditWord();
      } else {
        generateAuditPDF();
      }
    } else {
      if (!filteredRisks.length) return;
      if (selectedFormat === "excel") {
        generateExcel();
      } else if (selectedFormat === "word") {
        if (selectedReportType === "risk-detail") {
          generateWordDetail();
        } else {
          generateWordSummary();
        }
      } else if (selectedReportType === "risk-detail") {
        generateRiskDetailPDFKit();
      } else {
        generateSummaryPDF();
      }
    }
  };

  const generateSummaryPDF = () => {
    // Safety check
    if (!filteredRisks || filteredRisks.length === 0) {
      console.error("No risks available for PDF generation");
      return;
    }

    // Prepare table data
    const tableBody = [
      // Header row
      [
        { text: "Title", style: "tableHeader" },
        { text: "Category", style: "tableHeader" },
        { text: "Risk Level", style: "tableHeader" },
        { text: "Status", style: "tableHeader" },
        { text: "Owner", style: "tableHeader" },
        { text: "Score", style: "tableHeader" },
      ],
      // Data rows
      ...filteredRisks.map((risk, index) => {
        const row = [
          { text: risk.risk_name || "N/A", style: "tableCell" },
          { text: "N/A", style: "tableCell" }, // Category column - placeholder for now
          {
            text: risk.risk_level || "N/A",
            style: "tableCell",
            color:
              risk.risk_level === "Critical"
                ? "#7f1d1d" // Dark red/maroon - most alarming
                : risk.risk_level === "High"
                ? "#dc2626" // Bright red - very alarming
                : risk.risk_level === "Medium"
                ? "#f59e0b" // Orange - moderate concern
                : risk.risk_level === "Low"
                ? "#22c55e" // Green - minimal concern
                : "#6b7280", // Gray - not assessed
          },
          {
            text: (risk.status || "unknown")
              .replace("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            style: "tableCell",
          },
          { text: risk.risk_owner || "Unassigned", style: "tableCell" },
          { text: (risk.score || "N/A").toString(), style: "tableCell" },
        ];

        return row;
      }),
    ];

    // Build filters text
    const filtersText = [];
    if (selectedStatus !== "all") {
      filtersText.push(`Status: ${selectedStatus}`);
    }

    // PDFMake document definition
    const docDefinition = {
      fonts: {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      },
      content: [
        // Header
        {
          text: "RiskWorks - Risk Summary Report",
          style: "header",
        },
        {
          text: `Generated on: ${new Date().toLocaleDateString()}`,
          style: "subheader",
        },
        {
          text: `Total Risks: ${filteredRisks.length}`,
          style: "subheader",
        },
        // Filters (if any)
        ...(filtersText.length > 0
          ? [
              { text: "Filters Applied:", style: "subheader" },
              ...filtersText.map((filter) => ({
                text: filter,
                style: "filterText",
              })),
            ]
          : []),
        // Spacing
        { text: "", margin: [0, 10, 0, 0] },
        // Table
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto", "auto", "auto"],
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return "#3b82f6"; // Header row
              return rowIndex % 2 === 0 ? "#f8fafc" : null; // Alternating rows
            },
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: "#3b82f6",
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 10,
          color: "#64748b",
          margin: [0, 0, 0, 5],
        },
        filterText: {
          fontSize: 10,
          color: "#64748b",
          margin: [20, 0, 0, 5],
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: "white",
        },
        tableCell: {
          fontSize: 9,
          color: "#1e293b",
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
    };

    // Generate and download PDF
    try {
      pdfMake
        .createPdf(docDefinition)
        .download(`risk-summary-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please check the console for details.");
    }
  };

  const generateExcel = () => {
    // Create comprehensive Excel export with all risk fields
    // This structure is designed to be compatible with future import functionality

    const excelData = filteredRisks.map((risk) => ({
      // Basic Information
      "Risk ID": risk.id,
      "Risk Name": risk.risk_name,
      Description: risk.risk_description || "",
      Status: risk.status,
      "Risk Owner": risk.risk_owner || "",
      "Owner ID": risk.owner_id,

      // Risk Assessment
      Probability: risk.probability,
      Impact: risk.impact,
      "Risk Score": risk.score || "N/A",
      "Risk Level": risk.risk_level,

      // Risk Analysis
      "Probability Basis": risk.probability_basis || "",
      "Impact Basis": risk.impact_basis || "",
      Notes: risk.notes || "",

      // Dates
      "Created At": risk.created_at
        ? new Date(risk.created_at).toISOString()
        : "",
      "Updated At": risk.updated_at
        ? new Date(risk.updated_at).toISOString()
        : "",
      "Latest Reviewed Date": risk.latest_reviewed_date
        ? new Date(risk.latest_reviewed_date).toISOString()
        : "",

      // Additional fields for future compatibility
      Priority: "", // For future use
      "Mitigation Strategy": "", // For future use
      "Contingency Plan": "", // For future use
      "Review Frequency": "", // For future use
      "Next Review Date": "", // For future use
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 8 }, // Risk ID
      { wch: 25 }, // Risk Name
      { wch: 40 }, // Description
      { wch: 15 }, // Category
      { wch: 12 }, // Status
      { wch: 20 }, // Risk Owner
      { wch: 10 }, // Owner ID
      { wch: 10 }, // Assigned To
      { wch: 12 }, // Probability
      { wch: 8 }, // Impact
      { wch: 10 }, // Risk Score
      { wch: 12 }, // Risk Level
      { wch: 40 }, // Probability Basis
      { wch: 40 }, // Impact Basis
      { wch: 40 }, // Notes
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
      { wch: 20 }, // Latest Reviewed Date
      { wch: 12 }, // Priority
      { wch: 40 }, // Mitigation Strategy
      { wch: 40 }, // Contingency Plan
      { wch: 15 }, // Review Frequency
      { wch: 20 }, // Next Review Date
    ];
    worksheet["!cols"] = columnWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Risks");

    // Create Action Items worksheet
    if (actionItems && actionItems.length > 0) {
      const actionItemsData = actionItems.map((actionItem) => ({
        // Basic Information
        "Action Item ID": actionItem.id,
        Title: actionItem.title,
        Description: actionItem.description || "",
        "Action Type": actionItem.action_type,
        Priority: actionItem.priority,
        Status: actionItem.status,

        // Assignment
        "Created By": actionItem.created_by,
        "Risk ID": actionItem.risk_id,

        // Dates
        "Due Date": actionItem.due_date
          ? new Date(actionItem.due_date).toISOString()
          : "",
        "Completed Date": actionItem.completed_date
          ? new Date(actionItem.completed_date).toISOString()
          : "",
        "Created At": actionItem.created_at
          ? new Date(actionItem.created_at).toISOString()
          : "",
        "Updated At": actionItem.updated_at
          ? new Date(actionItem.updated_at).toISOString()
          : "",

        // Progress
        "Progress Percentage": actionItem.progress_percentage,

        // Additional fields for future compatibility
        "Estimated Hours": "", // For future use
        "Actual Hours": "", // For future use
        Cost: "", // For future use
        "Resources Required": "", // For future use
        Dependencies: "", // For future use
      }));

      const actionItemsWorksheet = XLSX.utils.json_to_sheet(actionItemsData);

      // Set column widths for action items
      const actionItemsColumnWidths = [
        { wch: 12 }, // Action Item ID
        { wch: 30 }, // Title
        { wch: 40 }, // Description
        { wch: 15 }, // Action Type
        { wch: 10 }, // Priority
        { wch: 12 }, // Status
        { wch: 12 }, // Assigned To
        { wch: 10 }, // Created By
        { wch: 8 }, // Risk ID
        { wch: 20 }, // Due Date
        { wch: 20 }, // Completed Date
        { wch: 20 }, // Created At
        { wch: 20 }, // Updated At
        { wch: 15 }, // Progress Percentage
        { wch: 12 }, // Estimated Hours
        { wch: 12 }, // Actual Hours
        { wch: 10 }, // Cost
        { wch: 20 }, // Resources Required
        { wch: 20 }, // Dependencies
      ];
      actionItemsWorksheet["!cols"] = actionItemsColumnWidths;

      XLSX.utils.book_append_sheet(
        workbook,
        actionItemsWorksheet,
        "Action Items"
      );
    }

    // Create a metadata sheet with export information
    const metadata = [
      { Field: "Export Date", Value: new Date().toISOString() },
      { Field: "Total Risks", Value: filteredRisks.length },
      { Field: "Total Action Items", Value: actionItems?.length || 0 },
      {
        Field: "Filters Applied",
        Value: selectedStatus !== "all" ? "Yes" : "No",
      },
      { Field: "Status Filter", Value: selectedStatus },
      { Field: "Export Format", Value: "Excel" },
      { Field: "Version", Value: "1.0" },
      { Field: "Compatible with Import", Value: "Yes" },
      {
        Field: "Includes Action Items",
        Value: actionItems && actionItems.length > 0 ? "Yes" : "No",
      },
    ];

    const metadataSheet = XLSX.utils.json_to_sheet(metadata);
    metadataSheet["!cols"] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Export Info");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `risk-export-${timestamp}.xlsx`;

    // Write and download the file
    XLSX.writeFile(workbook, filename);
  };

  const generateWordSummary = async () => {
    // Build filters text
    const filtersText = [];
    if (selectedStatus !== "all") {
      filtersText.push(`Status: ${selectedStatus}`);
    }

    // Create table rows
    const tableRows = [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Title", bold: true })],
              }),
            ],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Category", bold: true })],
              }),
            ],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Risk Level", bold: true })],
              }),
            ],
            width: { size: 12, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Status", bold: true })],
              }),
            ],
            width: { size: 12, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Owner", bold: true })],
              }),
            ],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Score", bold: true })],
              }),
            ],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      // Data rows
      ...filteredRisks.map(
        (risk) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: risk.risk_name || "N/A" })],
                  }),
                ],
              }),
              new TableCell({
                children: [new Paragraph({})],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: risk.risk_level || "N/A",
                        color:
                          risk.risk_level === "Critical"
                            ? "7F1D1D" // Dark red/maroon - most alarming
                            : risk.risk_level === "High"
                            ? "DC2626" // Bright red - very alarming
                            : risk.risk_level === "Medium"
                            ? "F59E0B" // Orange - moderate concern
                            : risk.risk_level === "Low"
                            ? "22C55E" // Green - minimal concern
                            : "6B7280", // Gray - not assessed
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: (risk.status || "unknown")
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: risk.risk_owner || "Unassigned" }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: (risk.score || 0).toString() }),
                    ],
                  }),
                ],
              }),
            ],
          })
      ),
    ];

    // Create document sections
    const sections = [
      // Header
      new Paragraph({
        children: [
          new TextRun({
            text: "RiskWorks - Risk Summary Report",
            bold: true,
            size: 32,
            color: "3B82F6",
          }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      }),
      // Generation date
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            size: 20,
            color: "64748B",
          }),
        ],
        spacing: { after: 100 },
      }),
      // Total risks
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Risks: ${filteredRisks.length}`,
            size: 20,
            color: "64748B",
          }),
        ],
        spacing: { after: 200 },
      }),
    ];

    // Add filters if any
    if (filtersText.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Filters Applied:",
              bold: true,
              size: 20,
              color: "64748B",
            }),
          ],
          spacing: { after: 100 },
        })
      );
      filtersText.forEach((filter) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: filter,
                size: 20,
                color: "64748B",
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 50 },
          })
        );
      });
      sections.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    // Add table
    sections.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    // Create document
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Roboto",
            },
            paragraph: {
              font: "Roboto",
            },
          },
        },
      },
      sections: [
        {
          children: sections,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `risk-summary-${
      new Date().toISOString().split("T")[0]
    }.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateWordDetail = async () => {
    // Create sections for each risk
    const riskSections = filteredRisks.map((risk, index) => {
      const riskScore =
        risk.probability && risk.impact ? risk.probability * risk.impact : null;

      return [
        // Page break for each risk
        new Paragraph({
          children: [new TextRun({ text: "", break: 1 })],
          pageBreakBefore: true,
        }),

        // Title Section (90% / 10% split)
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Title",
                          bold: true,
                          color: "3B82F6",
                          size: 20,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: risk.risk_name || "N/A",
                          bold: true,
                          size: 24,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                  ],
                  width: { size: 90, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `ID: ${risk.id}`,
                          size: 16,
                          color: "64748B",
                        }),
                      ],
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: risk.status
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase()),
                          size: 16,
                          color: "64748B",
                          bold: true,
                        }),
                      ],
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 100 },
                    }),
                  ],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),

        // Description
        new Paragraph({
          children: [
            new TextRun({
              text: "Description",
              bold: true,
              color: "3B82F6",
              size: 18,
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: risk.risk_description || "No description provided",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Two Column Layout for Basic Information and Risk Assessment
        new Table({
          rows: [
            new TableRow({
              children: [
                // Left Column - Basic Information
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Basic Information",
                          bold: true,
                          color: "1E293B",
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Risk Owner:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${risk.risk_owner || "Not specified"}`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Latest Reviewed:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${
                            risk.latest_reviewed_date
                              ? new Date(
                                  risk.latest_reviewed_date
                                ).toLocaleDateString()
                              : "Never reviewed"
                          }`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Category:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Created By (Owner ID):",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` User ID: ${risk.owner_id}`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                  ],
                  width: { size: 48, type: WidthType.PERCENTAGE },
                }),
                // Right Column - Risk Assessment
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Risk Assessment",
                          bold: true,
                          color: "1E293B",
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Probability:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${risk.probability}/5`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Impact:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({ text: ` ${risk.impact}/5`, size: 18 }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Risk Score:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${riskScore}`,
                          bold: true,
                          size: 22,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Risk Level:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({ text: ` ${risk.risk_level}`, size: 18 }),
                      ],
                      spacing: { after: 100 },
                    }),
                  ],
                  width: { size: 48, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),

        // Full Width Sections
        new Paragraph({
          children: [
            new TextRun({
              text: "Probability Basis",
              bold: true,
              color: "3B82F6",
              size: 18,
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text:
                risk.probability_basis ||
                "No probability justification provided",
              size: 18,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Impact Basis",
              bold: true,
              color: "3B82F6",
              size: 18,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: risk.impact_basis || "No impact justification provided",
              size: 18,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Notes",
              bold: true,
              color: "3B82F6",
              size: 18,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: risk.notes || "No notes provided", size: 18 }),
          ],
          spacing: { after: 200 },
        }),

        // Audit Information
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Created At:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${new Date(
                            risk.created_at
                          ).toLocaleString()}`,
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                  width: { size: 48, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Last Updated:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${new Date(
                            risk.updated_at
                          ).toLocaleString()}`,
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                  width: { size: 48, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on: ${new Date().toLocaleDateString()}`,
              size: 14,
              color: "64748B",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
      ];
    });

    // Flatten all sections
    const allSections = riskSections.flat();

    // Create document
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Roboto",
            },
            paragraph: {
              font: "Roboto",
            },
          },
        },
      },
      sections: [
        {
          children: allSections,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `risk-detail-report-${
      new Date().toISOString().split("T")[0]
    }.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Removed generateDetailedPDF function - no longer used

  const generateRiskDetailPDF = () => {
    // Create content for each risk with comprehensive field layout
    const riskPages = filteredRisks.flatMap((risk, index) => {
      const riskLevelColor =
        risk.risk_level === "Critical"
          ? "#7f1d1d" // Dark red/maroon - most alarming
          : risk.risk_level === "High"
          ? "#dc2626" // Bright red - very alarming
          : risk.risk_level === "Medium"
          ? "#f59e0b" // Orange - moderate concern
          : risk.risk_level === "Low"
          ? "#22c55e" // Green - minimal concern
          : "#6b7280"; // Gray - not assessed
      const riskScore =
        risk.probability && risk.impact ? risk.probability * risk.impact : null;

      return {
        stack: [
          // Header
          {
            stack: [
              { text: "RiskWorks", style: "companyHeader" },
              { text: "Risk Detail Report", style: "formHeader" },
            ],
            margin: [0, 0, 0, 20],
          },

          // Title Section with Risk ID and Status
          {
            columns: [
              {
                stack: [
                  { text: "Title", style: "sectionHeader" },
                  { text: risk.risk_name || "N/A", style: "riskTitle" },
                ],
                width: "90%",
              },
              {
                stack: [
                  { text: `ID: ${risk.id}`, style: "riskId" },
                  {
                    text: (risk.status || "unknown")
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                    style: "statusBadge",
                  },
                ],
                width: "10%",
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 20],
          },
          {
            text: "Description",
            style: "sectionHeader",
          },
          {
            text: risk.risk_description || "No description provided",
            style: "description",
            margin: [0, 0, 0, 20],
          },

          // Risk Level Badge
          {
            text: risk.risk_level || "N/A",
            style: "riskLevelBadge",
            color: "white",
            fillColor: riskLevelColor,
            margin: [0, 0, 0, 20],
          },

          // Two Column Layout for Main Information
          {
            columns: [
              // Left Column - Basic Information
              {
                stack: [
                  { text: "Basic Information", style: "subsectionHeader" },
                  { text: "", margin: [0, 5, 0, 0] }, // Spacing

                  { text: "Risk Owner:", style: "fieldLabel" },
                  {
                    text: risk.risk_owner || "Not specified",
                    style: "fieldValue",
                  },

                  { text: "Latest Reviewed:", style: "fieldLabel" },
                  {
                    text: risk.latest_reviewed_date
                      ? new Date(risk.latest_reviewed_date).toLocaleDateString()
                      : "Never reviewed",
                    style: "fieldValue",
                  },

                  { text: "Created By (Owner ID):", style: "fieldLabel" },
                  { text: `User ID: ${risk.owner_id}`, style: "fieldValue" },
                ],
                width: "*",
              },
              // Right Column - Risk Assessment
              {
                stack: [
                  { text: "Risk Assessment", style: "subsectionHeader" },
                  { text: "", margin: [0, 5, 0, 0] }, // Spacing

                  { text: "Probability:", style: "fieldLabel" },
                  { text: `${risk.probability}/5`, style: "fieldValue" },

                  { text: "Impact:", style: "fieldLabel" },
                  { text: `${risk.impact}/5`, style: "fieldValue" },

                  { text: "Risk Score:", style: "fieldLabel" },
                  {
                    text: riskScore ? riskScore.toString() : "N/A",
                    style: "riskScore",
                  },

                  { text: "Risk Level:", style: "fieldLabel" },
                  { text: risk.risk_level, style: "fieldValue" },
                ],
                width: "*",
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Probability Basis (Full Width)
          { text: "Probability Basis", style: "sectionHeader" },
          {
            text:
              risk.probability_basis || "No probability justification provided",
            style: "description",
            margin: [0, 0, 0, 20],
          },

          // Impact Basis (Full Width)
          { text: "Impact Basis", style: "sectionHeader" },
          {
            text: risk.impact_basis || "No impact justification provided",
            style: "description",
            margin: [0, 0, 0, 20],
          },

          // Notes (Full Width)
          { text: "Notes", style: "sectionHeader" },
          {
            text: risk.notes || "No notes provided",
            style: "description",
            margin: [0, 0, 0, 20],
          },

          // Audit Information (Two Column)
          {
            columns: [
              {
                stack: [
                  { text: "Created At:", style: "fieldLabel" },
                  {
                    text: new Date(risk.created_at).toLocaleString(),
                    style: "fieldValue",
                  },
                ],
                width: "*",
              },
              {
                stack: [
                  { text: "Last Updated:", style: "fieldLabel" },
                  {
                    text: new Date(risk.updated_at).toLocaleString(),
                    style: "fieldValue",
                  },
                ],
                width: "*",
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Footer
          {
            text: `Generated on: ${new Date().toLocaleDateString()} | Risk ID: ${
              risk.id
            }`,
            style: "footer",
            margin: [0, 20, 0, 0],
          },
        ],
      };
    });

    // PDFMake document definition
    const docDefinition = {
      fonts: {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      },
      content: riskPages,
      styles: {
        companyHeader: {
          fontSize: 18,
          bold: true,
          color: "white",
        },
        formHeader: {
          fontSize: 12,
          color: "white",
        },
        riskId: {
          fontSize: 10,
          color: "#64748b",
          margin: [0, 0, 0, 5],
        },
        statusBadge: {
          fontSize: 10,
          bold: true,
          color: "#3b82f6",
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: "#3b82f6",
          margin: [0, 10, 0, 5],
        },
        subsectionHeader: {
          fontSize: 11,
          bold: true,
          color: "#1e293b",
          margin: [0, 10, 0, 5],
        },
        riskTitle: {
          fontSize: 16,
          bold: true,
          color: "#1e293b",
        },
        riskLevelBadge: {
          fontSize: 14,
          bold: true,
          alignment: "center",
          margin: [10, 5, 10, 5],
        },
        fieldLabel: {
          fontSize: 9,
          color: "#64748b",
          margin: [0, 5, 0, 2],
        },
        fieldValue: {
          fontSize: 10,
          color: "#1e293b",
          margin: [0, 0, 0, 8],
        },
        riskScore: {
          fontSize: 14,
          bold: true,
          color: "#1e293b",
          margin: [0, 0, 0, 8],
        },
        description: {
          fontSize: 10,
          color: "#1e293b",
          lineHeight: 1.4,
        },
        footer: {
          fontSize: 10,
          color: "#64748b",
          alignment: "center",
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
      pageSize: "A4",
      pageMargins: [40, 10, 40, 20],
    };

    // Generate and download PDF
    pdfMake
      .createPdf(docDefinition)
      .download(
        `risk-detail-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
  };

  const generateRiskDetailPDFKit = () => {
    // Create individual pages for each risk with consistent margins
    const riskPages = filteredRisks.map((risk, index) => {
      const riskScore =
        risk.probability && risk.impact ? risk.probability * risk.impact : null;
      const riskLevelColor =
        risk.risk_level === "Critical"
          ? "#7f1d1d" // Dark red/maroon - most alarming
          : risk.risk_level === "High"
          ? "#dc2626" // Bright red - very alarming
          : risk.risk_level === "Medium"
          ? "#f59e0b" // Orange - moderate concern
          : risk.risk_level === "Low"
          ? "#22c55e" // Green - minimal concern
          : "#6b7280"; // Gray - not assessed

      return {
        // Force page break for each risk except the first
        pageBreak: index > 0 ? "before" : undefined,
        stack: [
          // Title Section (90% / 10% split)
          {
            columns: [
              {
                width: "90%",
                stack: [
                  { text: "Title", style: "fieldLabel" },
                  { text: risk.risk_name, style: "titleText" },
                ],
              },
              {
                width: "10%",
                stack: [
                  { text: `ID: ${risk.id}`, style: "infoText" },
                  {
                    text: (risk.status || "unknown")
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                    style: "statusText",
                  },
                ],
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Description
          {
            stack: [
              { text: "Description", style: "fieldLabel" },
              {
                text: risk.risk_description || "No description provided",
                style: "fieldValue",
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Two Column Layout
          {
            columns: [
              // Left Column - Basic Information
              {
                width: "48%",
                stack: [
                  { text: "Basic Information", style: "sectionHeader" },
                  {
                    table: {
                      widths: ["*"],
                      body: [
                        [
                          {
                            stack: [
                              { text: "Risk Owner:", style: "fieldLabel" },
                              {
                                text: risk.risk_owner || "Not specified",
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Latest Reviewed:", style: "fieldLabel" },
                              {
                                text: risk.latest_reviewed_date
                                  ? new Date(
                                      risk.latest_reviewed_date
                                    ).toLocaleDateString()
                                  : "Never reviewed",
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [],
                          },
                        ],
                        [
                          {
                            stack: [
                              {
                                text: "Created By (Owner ID):",
                                style: "fieldLabel",
                              },
                              {
                                text: `User ID: ${risk.owner_id}`,
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [],
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                  },
                ],
              },
              // Right Column - Risk Assessment
              {
                width: "48%",
                stack: [
                  { text: "Risk Assessment", style: "sectionHeader" },
                  {
                    table: {
                      widths: ["*"],
                      body: [
                        [
                          {
                            stack: [
                              { text: "Probability:", style: "fieldLabel" },
                              {
                                text: `${risk.probability}/5`,
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Impact:", style: "fieldLabel" },
                              {
                                text: `${risk.impact}/5`,
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Risk Score:", style: "fieldLabel" },
                              {
                                text: riskScore ? riskScore.toString() : "N/A",
                                style: "riskScoreText",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Risk Level:", style: "fieldLabel" },
                              {
                                text: risk.risk_level || "N/A",
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                  },
                ],
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Full Width Sections
          {
            stack: [
              {
                stack: [
                  { text: "Probability Basis", style: "fieldLabel" },
                  {
                    text:
                      risk.probability_basis ||
                      "No probability justification provided",
                    style: "fieldValue",
                  },
                ],
                margin: [0, 0, 0, 15],
              },
              {
                stack: [
                  { text: "Impact Basis", style: "fieldLabel" },
                  {
                    text:
                      risk.impact_basis || "No impact justification provided",
                    style: "fieldValue",
                  },
                ],
                margin: [0, 0, 0, 15],
              },
              {
                stack: [
                  { text: "Notes", style: "fieldLabel" },
                  {
                    text: risk.notes || "No notes provided",
                    style: "fieldValue",
                  },
                ],
                margin: [0, 0, 0, 15],
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Audit Information
          {
            columns: [
              {
                width: "48%",
                stack: [
                  { text: "Created At:", style: "fieldLabel" },
                  {
                    text: new Date(risk.created_at).toLocaleString(),
                    style: "fieldValue",
                  },
                ],
              },
              {
                width: "48%",
                stack: [
                  { text: "Last Updated:", style: "fieldLabel" },
                  {
                    text: new Date(risk.updated_at).toLocaleString(),
                    style: "fieldValue",
                  },
                ],
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Footer - Push to bottom of page
          {
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            style: "footer",
            margin: [0, 0, 0, 0],
            absolutePosition: { x: 40, y: 750 }, // Position at bottom of US Letter page
          },
        ],
      };
    });

    // PDFMake document definition with consistent margins
    const docDefinition = {
      fonts: {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      },
      content: riskPages,
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
      },
      styles: {
        companyHeader: {
          fontSize: 18,
          color: "#3b82f6",
          bold: true,
        },
        formHeader: {
          fontSize: 12,
          color: "#3b82f6",
          margin: [0, 5, 0, 0],
        },
        fieldLabel: {
          fontSize: 12,
          color: "#3b82f6",
          bold: true,
          margin: [0, 0, 0, 5],
        },
        titleText: {
          fontSize: 16,
          color: "#1e293b",
          bold: true,
        },
        infoText: {
          fontSize: 10,
          color: "#64748b",
        },
        statusText: {
          fontSize: 10,
          color: "#3b82f6",
          bold: true,
        },
        sectionHeader: {
          fontSize: 11,
          color: "#1e293b",
          bold: true,
          margin: [0, 0, 0, 10],
        },
        fieldValue: {
          fontSize: 10,
          color: "#1e293b",
          margin: [0, 0, 0, 8],
        },
        riskScoreText: {
          fontSize: 14,
          color: "#1e293b",
          bold: true,
          margin: [0, 0, 0, 8],
        },
        footer: {
          fontSize: 10,
          color: "#64748b",
          alignment: "center",
        },
      },
      pageMargins: [40, 20, 40, 20], // Consistent margins for all pages
      pageSize: "LETTER",
    };

    pdfMake
      .createPdf(docDefinition)
      .download(
        `risk-detail-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
  };

  // Audit History Export Functions
  const generateAuditExcel = () => {
    if (!auditLogs || auditLogs.length === 0) {
      console.error("No audit logs available for export");
      return;
    }

    // Prepare audit data for Excel
    const auditData = auditLogs.map((log) => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      "Entity Type": log.entity_type,
      "Entity ID": log.entity_id,
      User: log.user_email || `User ${log.user_id}`,
      Action: log.action,
      Description: log.description || "",
      Changes: log.changes ? JSON.stringify(log.changes, null, 2) : "",
      "IP Address": log.ip_address || "",
      "User Agent": log.user_agent || "",
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(auditData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 20 }, // Timestamp
      { wch: 15 }, // Entity Type
      { wch: 10 }, // Entity ID
      { wch: 25 }, // User
      { wch: 15 }, // Action
      { wch: 40 }, // Description
      { wch: 50 }, // Changes
      { wch: 15 }, // IP Address
      { wch: 30 }, // User Agent
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit History");

    // Add metadata sheet
    const metadata = [
      { Field: "Export Date", Value: new Date().toISOString() },
      { Field: "Total Audit Logs", Value: auditLogs.length },
      { Field: "Export Format", Value: "Excel" },
      { Field: "Version", Value: "1.0" },
    ];

    const metadataSheet = XLSX.utils.json_to_sheet(metadata);
    metadataSheet["!cols"] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Export Info");

    // Generate filename and download
    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `audit-history-${timestamp}.xlsx`);
  };

  const generateAuditWord = async () => {
    if (!auditLogs || auditLogs.length === 0) {
      console.error("No audit logs available for export");
      return;
    }

    // Create audit log sections
    const auditSections = auditLogs.map((log, index) => {
      const changesText = log.changes
        ? Object.entries(log.changes)
            .map(([key, value]) => {
              if (typeof value === "object" && value !== null) {
                const oldVal = value.old !== undefined ? value.old : "N/A";
                const newVal = value.new !== undefined ? value.new : "N/A";
                return `${key}: ${oldVal} → ${newVal}`;
              }
              return `${key}: ${value}`;
            })
            .join(", ")
        : "No changes recorded";

      return (
        new Paragraph({
          children: [
            new TextRun({
              text: `Audit Log ${index + 1}`,
              bold: true,
              size: 20,
              color: "2563EB",
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Timestamp: ", bold: true }),
            new TextRun({ text: new Date(log.timestamp).toLocaleString() }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Entity: ", bold: true }),
            new TextRun({ text: `${log.entity_type} (ID: ${log.entity_id})` }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "User: ", bold: true }),
            new TextRun({ text: log.user_email || `User ${log.user_id}` }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Action: ", bold: true }),
            new TextRun({ text: log.action }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Description: ", bold: true }),
            new TextRun({ text: log.description || "No description" }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Changes: ", bold: true }),
            new TextRun({ text: changesText }),
          ],
          spacing: { after: 200 },
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Audit History Report",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on ${new Date().toLocaleDateString()}`,
                  size: 20,
                  color: "64748B",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Total Audit Logs: ${auditLogs.length}`,
                  bold: true,
                  size: 18,
                }),
              ],
              spacing: { after: 400 },
            }),
            ...auditSections,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-history-${
      new Date().toISOString().split("T")[0]
    }.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateAuditPDF = () => {
    if (!auditLogs || auditLogs.length === 0) {
      console.error("No audit logs available for PDF generation");
      return;
    }

    // Create audit log data for PDF
    const auditTableData = auditLogs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.entity_type,
      log.entity_id.toString(),
      log.user_email || `User ${log.user_id}`,
      log.action,
      log.description || "No description",
      log.changes ? JSON.stringify(log.changes, null, 2) : "No changes",
    ]);

    const docDefinition = {
      content: [
        {
          text: "Audit History Report",
          style: "header",
          alignment: "center",
        },
        {
          text: `Generated on ${new Date().toLocaleDateString()}`,
          style: "subheader",
          alignment: "center",
        },
        {
          text: `Total Audit Logs: ${auditLogs.length}`,
          style: "subheader",
          alignment: "center",
        },
        {
          text: " ",
          margin: [0, 20, 0, 0],
        },
        {
          table: {
            headerRows: 1,
            widths: ["15%", "10%", "8%", "15%", "10%", "20%", "22%"],
            body: [
              [
                "Timestamp",
                "Entity Type",
                "Entity ID",
                "User",
                "Action",
                "Description",
                "Changes",
              ],
              ...auditTableData,
            ],
          },
          layout: "lightHorizontalLines",
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          margin: [0, 0, 0, 10],
        },
      },
      defaultStyle: {
        fontSize: 8,
      },
    };

    pdfMake
      .createPdf(docDefinition)
      .download(`audit-history-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "mitigated":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case "escalated":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-red-900 text-red-100 border-red-800"; // Dark red - most alarming
      case "High":
        return "bg-red-100 text-red-800 border-red-200"; // Bright red - very alarming
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Orange - moderate concern
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"; // Green - minimal concern
      case "Not Assessed":
        return "bg-gray-100 text-gray-600 border-gray-300"; // Gray - not assessed
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading || actionItemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Filters Section */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Report Type
                </label>
                <select
                  value={selectedReportType}
                  onChange={(e) =>
                    setSelectedReportType(
                      e.target.value as
                        | "summary"
                        | "risk-detail"
                        | "audit-history"
                    )
                  }
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="summary">Summary Table</option>
                  <option value="risk-detail">
                    Risk Detail Report (All Fields)
                  </option>
                  <option value="audit-history">Audit History Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="mitigated">Mitigated</option>
                  <option value="closed">Closed</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Export Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) =>
                    setSelectedFormat(
                      e.target.value as "pdf" | "excel" | "word"
                    )
                  }
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="word">Word</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3 lg:ml-4">
            <button
              onClick={() => setShowRiskTrends(true)}
              className="btn-secondary"
            >
              <TrendingUp className="h-4 w-4" />
              Risk Trends
            </button>
            <button
              onClick={generateExport}
              disabled={
                selectedReportType === "audit-history"
                  ? !auditLogs.length
                  : !filteredRisks.length
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot Management Section */}
      <div className="glass p-6 space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Risk Register Snapshots
        </h3>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-secondary-600 mb-3">
              Create snapshots of your current risk register to save the state
              before making changes. You can restore from any snapshot if
              needed.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateSnapshot(!showCreateSnapshot)}
                className="btn-primary"
              >
                <Camera className="h-4 w-4" />
                Create Snapshot
              </button>
              <div className="flex items-center gap-2">
                <input
                  id="snapshot-import-file"
                  type="file"
                  accept=".json"
                  onChange={handleSnapshotFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="snapshot-import-file"
                  className="btn-secondary cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Import Snapshot
                </label>
                {snapshotImportFile && (
                  <button
                    onClick={handleImportSnapshot}
                    className="btn-primary"
                  >
                    Import
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Snapshot Form */}
        {showCreateSnapshot && (
          <div className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
            <h4 className="text-md font-medium text-secondary-900 mb-3">
              Create New Snapshot
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Snapshot Name *
                </label>
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="e.g., Before Import - Dec 2024"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={snapshotDescription}
                  onChange={(e) => setSnapshotDescription(e.target.value)}
                  placeholder="Describe what this snapshot contains or why you're creating it..."
                  rows={2}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={createNewSnapshot} className="btn-primary">
                  <Camera className="h-4 w-4" />
                  Create Snapshot
                </button>
                <button
                  onClick={() => {
                    setShowCreateSnapshot(false);
                    setSnapshotName("");
                    setSnapshotDescription("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Snapshots List */}
        {snapshots && snapshots.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setSnapshotsExpanded(!snapshotsExpanded)}
              className="flex items-center gap-2 text-md font-medium text-secondary-900 hover:text-secondary-700 transition-colors"
            >
              <History className="h-4 w-4" />
              Available Snapshots ({snapshots.length})
              {snapshotsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {snapshotsExpanded && (
              <div className="grid gap-3">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="border border-secondary-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-secondary-900">
                          {snapshot.name}
                        </h5>
                        {snapshot.description && (
                          <p className="text-sm text-secondary-600 mt-1">
                            {snapshot.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-secondary-500">
                          <span>
                            {new Date(snapshot.created_at).toLocaleString()}
                          </span>
                          <span>{snapshot.risk_count} risks</span>
                          <span>
                            {snapshot.action_items_count} action items
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() =>
                            handleExportSnapshot(snapshot.id, snapshot.name)
                          }
                          className="btn-primary text-xs"
                          title="Export this snapshot as a file"
                        >
                          <Download className="h-3 w-3" />
                          Export
                        </button>
                        <button
                          onClick={() => handleRestoreSnapshot(snapshot.id)}
                          className="btn-secondary text-xs"
                          title="Restore this snapshot"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snapshot.id)}
                          className="btn-danger text-xs"
                          title="Delete this snapshot"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {snapshots && snapshots.length === 0 && (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No snapshots created yet</p>
            <p className="text-sm text-secondary-500 mt-1">
              Create your first snapshot to save the current state of your risk
              register
            </p>
          </div>
        )}

        {/* Snapshot Status */}
        {snapshotStatus.type && (
          <div
            className={`p-3 rounded-lg ${
              snapshotStatus.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : snapshotStatus.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {snapshotStatus.type === "success" && (
                <CheckCircle className="h-4 w-4" />
              )}
              {snapshotStatus.type === "error" && (
                <AlertTriangle className="h-4 w-4" />
              )}
              {snapshotStatus.type === "info" && <Clock className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {snapshotStatus.message}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className="glass p-6 space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Risks from Excel
        </h3>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-secondary-600 mb-3">
              Import risk data from an Excel file with the same structure as the
              export format. The file should have a "Risks" worksheet with
              columns matching the export format.
            </p>
            <div className="flex items-center gap-3">
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <button
                onClick={analyzeExcelConflicts}
                disabled={!importFile}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                Import
              </button>
            </div>
          </div>
        </div>

        {/* Import Status */}
        {importStatus.type && (
          <div
            className={`p-3 rounded-lg ${
              importStatus.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : importStatus.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {importStatus.type === "success" && (
                <CheckCircle className="h-4 w-4" />
              )}
              {importStatus.type === "error" && (
                <AlertTriangle className="h-4 w-4" />
              )}
              {importStatus.type === "info" && <Clock className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {importStatus.message}
              </span>
            </div>
          </div>
        )}

        {/* Conflict Resolution UI */}
        {importConflicts.showConflictResolution && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Import Conflicts Detected
            </h3>
            <p className="text-gray-600 mb-4">
              Found {importConflicts.conflicts.length} conflicts,{" "}
              {importConflicts.newRisks.length} new risks, and{" "}
              {importConflicts.newActionItems.length} action items. Please
              review each conflict and choose how to handle it.
            </p>

            <div className="space-y-4">
              {importConflicts.conflicts.map((conflict, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">
                      Conflict {index + 1}: {conflict.excelRisk.risk_name}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        conflict.conflictType === "id_exists"
                          ? "bg-yellow-100 text-yellow-800"
                          : conflict.conflictType === "name_exists"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {conflict.conflictType === "id_exists"
                        ? "ID Conflict"
                        : conflict.conflictType === "name_exists"
                        ? "Name Conflict"
                        : "ID & Name Conflict"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Existing Data:
                      </h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>ID:</strong> {conflict.existingRisk.id}
                        </p>
                        {getFieldsWithDifferences(
                          conflict.existingRisk,
                          conflict.excelRisk
                        ).map((field) => (
                          <ExistingDataText
                            key={field.key}
                            existingText={
                              conflict.existingRisk[field.key]?.toString() ||
                              "N/A"
                            }
                            newText={
                              conflict.excelRisk[field.key]?.toString() || "N/A"
                            }
                            label={field.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Excel Data:
                      </h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>ID:</strong> {conflict.excelRisk.id || "N/A"}
                        </p>
                        {getFieldsWithDifferences(
                          conflict.existingRisk,
                          conflict.excelRisk
                        ).map((field) => (
                          <NewDataText
                            key={field.key}
                            existingText={
                              conflict.existingRisk[field.key]?.toString() ||
                              "N/A"
                            }
                            newText={
                              conflict.excelRisk[field.key]?.toString() || "N/A"
                            }
                            label={field.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        handleConflictResolution(index, "keep_existing")
                      }
                      className={`text-sm flex items-center justify-center ${
                        conflictResolutions[index] === "keep_existing"
                          ? "btn-primary"
                          : "btn-secondary"
                      }`}
                    >
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Keep Existing
                      {conflictResolutions[index] === "keep_existing" && (
                        <span className="ml-2 text-xs">✓</span>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleConflictResolution(index, "replace_with_excel")
                      }
                      className={`text-sm flex items-center justify-center ${
                        conflictResolutions[index] === "replace_with_excel"
                          ? "btn-primary"
                          : "btn-secondary"
                      }`}
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Replace with Excel
                      {conflictResolutions[index] === "replace_with_excel" && (
                        <span className="ml-2 text-xs">✓</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {/* Individual Resolution Button */}
              {allConflictsResolved && (
                <button
                  onClick={applyIndividualResolutions}
                  className="btn-primary"
                >
                  Apply Individual Resolutions
                </button>
              )}

              {/* Bulk Action Buttons */}
              <button
                onClick={() => {
                  // Reset individual resolutions
                  setConflictResolutions({});
                  // Apply "Keep Existing" to all conflicts
                  const resolvedConflicts = importConflicts.conflicts.map(
                    (c) => ({
                      ...c.excelRisk,
                      id: undefined, // Remove ID to create new risk
                    })
                  );
                  executeImport(
                    importConflicts.newRisks,
                    resolvedConflicts,
                    importConflicts.newActionItems
                  );
                }}
                className="btn-secondary"
              >
                Keep Existing for All
              </button>
              <button
                onClick={() => {
                  // Reset individual resolutions
                  setConflictResolutions({});
                  // Apply "Replace with Excel" to all conflicts
                  const resolvedConflicts = importConflicts.conflicts.map(
                    (c) => c.excelRisk
                  );
                  executeImport(
                    importConflicts.newRisks,
                    resolvedConflicts,
                    importConflicts.newActionItems
                  );
                }}
                className="btn-primary"
              >
                Replace All with Excel Data
              </button>
              <button
                onClick={() => {
                  // Reset individual resolutions
                  setConflictResolutions({});
                  // Skip all conflicts, only import new risks
                  executeImport(
                    importConflicts.newRisks,
                    [],
                    importConflicts.newActionItems
                  );
                }}
                className="btn-secondary"
              >
                Skip Conflicts, Import New Only
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            {selectedReportType === "audit-history"
              ? `Preview (${auditLogs.length} audit logs)`
              : `Preview (${filteredRisks.length} risks)`}
          </h3>
          <div className="text-sm text-secondary-600">
            {selectedReportType === "audit-history"
              ? "Showing audit history"
              : "Showing filtered results"}
          </div>
        </div>

        {selectedReportType === "audit-history" ? (
          // Audit History Display
          auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">No audit logs available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-700">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-700">
                      Entity
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-700">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-700">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-700">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-700">
                      Changes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-secondary-100 hover:bg-secondary-50"
                    >
                      <td className="py-3 px-4 text-sm text-secondary-700">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-700">
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-700">
                        {log.user_email || `User ${log.user_id}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-700">
                        {log.description || "No description"}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-700">
                        {log.changes ? (
                          <div className="max-w-xs truncate">
                            {Object.entries(log.changes)
                              .map(([key, value]) => {
                                if (
                                  typeof value === "object" &&
                                  value !== null
                                ) {
                                  const oldVal =
                                    value.old !== undefined ? value.old : "N/A";
                                  const newVal =
                                    value.new !== undefined ? value.new : "N/A";
                                  return `${key}: ${oldVal} → ${newVal}`;
                                }
                                return `${key}: ${value}`;
                              })
                              .join(", ")}
                          </div>
                        ) : (
                          "No changes"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredRisks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">
              No risks match the selected filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Risk Level
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Owner
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-secondary-100 hover:bg-secondary-50"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-secondary-900">
                        {risk.risk_name}
                      </div>
                      {risk.risk_description && (
                        <div className="text-sm text-secondary-600 truncate max-w-xs">
                          {risk.risk_description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(
                          risk.risk_level
                        )}`}
                      >
                        {risk.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(risk.status)}
                        <span className="text-sm text-secondary-700">
                          {risk.status
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-700">
                      {risk.risk_owner || "Unassigned"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-medium text-secondary-900">
                        {risk.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Risk Trends Modal/Overlay */}
      {showRiskTrends && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <RiskTrends onClose={() => setShowRiskTrends(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
