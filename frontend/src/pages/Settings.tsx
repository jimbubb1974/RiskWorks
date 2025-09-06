import { useState, useEffect } from "react";
import {
  Server,
  Database,
  Globe,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Settings as SettingsIcon,
  User,
  Cloud,
  Monitor,
  Zap,
  ArrowLeftRight,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Info,
  BarChart3,
} from "lucide-react";
import { apiClient } from "../services/api";
import { environmentSwitchService } from "../services/environmentSwitch";

interface SwitchResult {
  success: boolean;
  message: string;
  requiresRestart?: boolean;
  newConfig?: any;
}

interface PortStatus {
  port: number;
  service: string;
  status: "active" | "inactive" | "error";
  description?: string;
}

// Define EnvironmentConfig locally to avoid import issues
interface EnvironmentConfig {
  environment: "development" | "staging" | "production";
  isCloud: boolean;
  cloudProvider: "local" | "railway" | "render" | "aws" | "custom";
  database: {
    type: "sqlite" | "postgresql";
    isLocal: boolean;
  };
  services: {
    frontend: {
      local: string;
      cloud?: string;
      effective: string;
    };
    backend: {
      local: string;
      cloud?: string;
      effective: string;
    };
  };
  cors: {
    origins: string[];
    count: number;
  };
}

interface SystemStatus {
  backend: {
    status: "online" | "offline" | "error";
    responseTime?: number;
    lastChecked: Date;
  };
  database: {
    status: "connected" | "disconnected" | "error" | "unknown";
    lastChecked: Date;
  };
  ports: PortStatus[];
  lastUpdated: Date;
  environment?: EnvironmentConfig;
  systemInfo?: any; // Store the full system status response
}

export default function Settings() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    backend: { status: "offline", lastChecked: new Date() },
    database: { status: "disconnected", lastChecked: new Date() },
    ports: [],
    lastUpdated: new Date(),
  });
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "preferences">(
    "status"
  );
  const [showEnvSwitcher, setShowEnvSwitcher] = useState(false);
  const [switchingEnv, setSwitchingEnv] = useState(false);
  const [switchingFrontend, setSwitchingFrontend] = useState(false);
  const [switchingBackend, setSwitchingBackend] = useState(false);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    environment: false,
    services: false,
    system: false,
    ports: false,
  });

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check backend health and system status
  const checkBackendHealth = async () => {
    try {
      const startTime = Date.now();

      // First check basic health
      const healthResponse = await apiClient.get("/health");
      const endTime = Date.now();

      if (healthResponse.status === 200) {
        // Now get detailed system status
        try {
          const systemResponse = await apiClient.get("/system/status");

          if (systemResponse.status === 200) {
            const systemData = systemResponse.data;
            setSystemStatus((prev) => ({
              ...prev,
              backend: {
                status: "online",
                responseTime: endTime - startTime,
                lastChecked: new Date(),
              },
              database: {
                status: systemData.database.status,
                lastChecked: new Date(),
              },
              systemInfo: systemData,
            }));
          } else {
            setSystemStatus((prev) => ({
              ...prev,
              backend: {
                status: "online",
                responseTime: endTime - startTime,
                lastChecked: new Date(),
              },
              database: {
                status: "unknown",
                lastChecked: new Date(),
              },
            }));
          }
        } catch (error) {
          setSystemStatus((prev) => ({
            ...prev,
            backend: {
              status: "online",
              responseTime: endTime - startTime,
              lastChecked: new Date(),
            },
            database: {
              status: "unknown",
              lastChecked: new Date(),
            },
          }));
        }
      } else {
        setSystemStatus((prev) => ({
          ...prev,
          backend: {
            status: "error",
            lastChecked: new Date(),
          },
          database: {
            status: "unknown",
            lastChecked: new Date(),
          },
        }));
      }
    } catch (error) {
      setSystemStatus((prev) => ({
        ...prev,
        backend: {
          status: "offline",
          lastChecked: new Date(),
        },
        database: {
          status: "unknown",
          lastChecked: new Date(),
        },
      }));
    }
  };

  // Check common development ports using backend endpoint
  const checkPorts = async () => {
    try {
      const response = await apiClient.get("/system/ports");

      if (response.status === 200) {
        const data = response.data;
        setSystemStatus((prev) => ({
          ...prev,
          ports: data.ports,
          lastUpdated: new Date(),
        }));
      } else {
        // Fallback to frontend port checking if backend fails
        const commonPorts = [
          {
            port: 3000,
            service: "React Dev Server",
            description: "Default React development server",
          },
          {
            port: 5173,
            service: "Vite Dev Server",
            description: "Vite development server (current)",
          },
          {
            port: 8000,
            service: "FastAPI Backend",
            description: "Python FastAPI backend server",
          },
          {
            port: 5432,
            service: "PostgreSQL",
            description: "PostgreSQL database (if using)",
          },
          {
            port: 3306,
            service: "MySQL",
            description: "MySQL database (if using)",
          },
          {
            port: 6379,
            service: "Redis",
            description: "Redis cache (if using)",
          },
          {
            port: 8080,
            service: "Alternative Backend",
            description: "Alternative backend port",
          },
        ];

        const portChecks = await Promise.allSettled(
          commonPorts.map(async ({ port, service, description }) => {
            // Special handling for Vite dev server (port 5173)
            if (port === 5173) {
              try {
                // Vite dev server responds to root path
                await fetch(`http://localhost:${port}/`, {
                  method: "GET",
                  mode: "no-cors",
                });
                return {
                  port,
                  service,
                  status: "active" as const,
                  description,
                };
              } catch (error) {
                // If that fails, try a simple connection test
                try {
                  await fetch(`http://localhost:${port}`, {
                    method: "GET",
                    mode: "no-cors",
                  });
                  return {
                    port,
                    service,
                    status: "active" as const,
                    description,
                  };
                } catch (error2) {
                  return {
                    port,
                    service,
                    status: "inactive" as const,
                    description,
                  };
                }
              }
            }

            // For other ports, try health endpoint first, then root
            try {
              await fetch(`http://localhost:${port}/health`, {
                method: "GET",
                mode: "no-cors",
              });
              return {
                port,
                service,
                status: "active" as const,
                description,
              };
            } catch (error) {
              // Try root path as fallback
              try {
                await fetch(`http://localhost:${port}`, {
                  method: "GET",
                  mode: "no-cors",
                });
                return {
                  port,
                  service,
                  status: "active" as const,
                  description,
                };
              } catch {
                return {
                  port,
                  service,
                  status: "inactive" as const,
                  description,
                };
              }
            }
          })
        );

        const ports = portChecks.map((result, index) => {
          if (result.status === "fulfilled") {
            return result.value;
          }
          return {
            port: commonPorts[index].port,
            service: commonPorts[index].service,
            status: "error" as const,
            description: commonPorts[index].description,
          };
        });

        setSystemStatus((prev) => ({
          ...prev,
          ports,
          lastUpdated: new Date(),
        }));
      }
    } catch (error) {
      // The frontend fallback logic is already handled above in the else block
    }
  };

  // Fetch deployment information
  const fetchDeploymentInfo = async () => {
    try {
      const response = await apiClient.get("/system/deployment");
      if (response.status === 200) {
        console.log("Deployment info received:", response.data);
        setDeploymentInfo(response.data);
      }
    } catch (error) {
      console.error("Failed to get deployment info:", error);
    }
  };

  // Refresh all status checks
  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        checkBackendHealth(),
        checkPorts(),
        // Get environment configuration from backend
        apiClient
          .get("/system/config")
          .then((response) => {
            if (response.status === 200) {
              setSystemStatus((prev) => ({
                ...prev,
                environment: response.data,
              }));
            }
          })
          .catch((error) => {
            console.error("Failed to get environment config:", error);
          }),
        // Get deployment information
        fetchDeploymentInfo(),
      ]);
    } catch (error) {
      console.error("Error refreshing status:", error);
    }
    setIsLoading(false);
  };

  // Simple environment switching (no complex config needed)
  const handleSimpleSwitch = async (action: "local" | "cloud") => {
    setSwitchingEnv(true);
    try {
      const token = localStorage.getItem("token");
      console.log(`🔄 Switching to ${action} environment...`);

      const response = await apiClient.post("/system/switch-env", { action });

      if (response.status === 200) {
        const result = response.data;
        console.log(`✅ Environment switch successful:`, result);

        // Show success message with restart instructions
        if (result.restart_required && result.restart_instructions) {
          const instructions = Object.values(result.restart_instructions).join(
            "\n"
          );
          alert(
            `Successfully switched to ${action} environment!\n\n` +
              `Manual backend restart required:\n\n` +
              instructions
          );
        } else {
          alert(
            `Successfully switched to ${action} environment! Manual backend restart required.`
          );
        }

        // Close modal
        setShowEnvSwitcher(false);

        // Wait for backend to restart, then refresh
        const waitTime = result.restart_required ? 5000 : 3000;
        setTimeout(async () => {
          try {
            await refreshStatus();
          } catch (error) {
            console.log(
              "Status refresh failed (backend may still be restarting)"
            );
          }
        }, waitTime);
      } else {
        const errorData = response.data || {};
        throw new Error(
          errorData.detail || `Failed to switch to ${action} environment`
        );
      }
    } catch (error) {
      console.error("Environment switch failed:", error);
      alert(
        `Failed to switch environment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setSwitchingEnv(false);
    }
  };

  // Handle frontend environment switching
  const handleFrontendSwitch = async (
    targetPlatform: "vercel" | "netlify" | "local"
  ) => {
    setSwitchingFrontend(true);
    setSwitchMessage(null);

    try {
      const result = await environmentSwitchService.switchFrontend(
        targetPlatform
      );

      if (result.success) {
        let msg =
          "Switch applied. Please restart your frontend dev server:\n- Frontend: cd frontend && npm run dev";
        if (targetPlatform !== "local") {
          const cloudUrl =
            targetPlatform === "vercel"
              ? "https://risk-works.vercel.app"
              : "https://riskworks.netlify.app";
          msg = `Switch applied.\nCloud frontend URL: ${cloudUrl}\n\nPlease restart your frontend dev server:\n- Frontend: cd frontend && npm run dev`;
        }
        setSwitchMessage(msg);
        try {
          localStorage.setItem("pendingSwitchMessage", msg);
        } catch {}
      } else {
        setSwitchMessage(result.message);
      }
    } catch (error) {
      const errorMessage = `Failed to switch frontend: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      setSwitchMessage(errorMessage);
    } finally {
      setSwitchingFrontend(false);
    }
  };

  // Handle backend environment switching
  const handleBackendSwitch = async (targetPlatform: "render" | "local") => {
    setSwitchingBackend(true);
    setSwitchMessage(null);

    try {
      const result = await environmentSwitchService.switchBackend(
        targetPlatform
      );

      if (result.success) {
        const msg =
          "Switch applied. Please restart both services:\n- Backend: cd backend && python .\\run.py\n- Frontend: cd frontend && npm run dev";
        setSwitchMessage(msg);
        try {
          localStorage.setItem("pendingSwitchMessage", msg);
        } catch {}
        // Do not auto-refresh; keep instructions visible until user acts
      } else {
        setSwitchMessage(result.message);
        setTimeout(() => {
          alert(result.message);
        }, 1000);
      }
    } catch (error) {
      const errorMessage = `Failed to switch backend: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      setSwitchMessage(errorMessage);
      setTimeout(() => {
        alert(errorMessage);
      }, 1000);
    } finally {
      setSwitchingBackend(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    refreshStatus();

    // Refresh every 30 seconds
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "active":
      case "connected":
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case "offline":
      case "inactive":
      case "disconnected":
        return <XCircle className="w-5 h-5 text-secondary-400" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-danger-600" />;
      default:
        return <Clock className="w-5 h-5 text-warning-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "active":
      case "connected":
        return "text-success-600 bg-success-50 border-success-200";
      case "offline":
      case "inactive":
      case "disconnected":
        return "text-secondary-600 bg-secondary-50 border-secondary-200";
      case "error":
        return "text-danger-600 bg-danger-50 border-danger-200";
      default:
        return "text-warning-600 bg-warning-50 border-warning-200";
    }
  };

  // Derive a clear indicator for DB target (Neon vs Local) from engine URL
  const dbEngine = systemStatus.systemInfo?.database?.engine as
    | string
    | undefined;
  const isCloudEnv = systemStatus.environment?.isCloud === true;

  const extractHost = (engine?: string): string => {
    if (!engine) return "";
    if (engine.startsWith("sqlite")) return "local file";
    const atIdx = engine.indexOf("@");
    let after = "";
    if (atIdx >= 0) {
      after = engine.slice(atIdx + 1);
    } else {
      const schemeIdx = engine.indexOf("://");
      after = schemeIdx >= 0 ? engine.slice(schemeIdx + 3) : engine;
    }
    const host = after.split("/")[0] || "";
    return host;
  };

  const engineHost = extractHost(dbEngine);

  const dbLabel = (() => {
    if (dbEngine?.includes(".neon.tech")) return "Neon Cloud";
    if (isCloudEnv && dbEngine?.startsWith("postgresql")) return "Cloud";
    if (dbEngine?.startsWith("sqlite")) return "SQLite (Local)";
    if (dbEngine?.includes("localhost") || dbEngine?.includes("127.0.0.1"))
      return "Local";
    return dbEngine ? "Remote" : "Unknown";
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            System Settings & Status
          </h1>
          <p className="text-secondary-600">
            Monitor system health, ports, and configuration
          </p>
        </div>
        <button
          onClick={refreshStatus}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("status")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "status"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            System Status
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "preferences"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300"
            }`}
          >
            <SettingsIcon className="w-4 h-4 inline mr-2" />
            Preferences
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "status" ? (
        <div className="space-y-6">
          {/* System Overview */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                System Overview
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                {getStatusIcon(systemStatus.backend.status)}
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Backend
                  </p>
                  <p
                    className={`text-sm ${
                      getStatusColor(systemStatus.backend.status).split(" ")[0]
                    }`}
                  >
                    {systemStatus.backend.status.charAt(0).toUpperCase() +
                      systemStatus.backend.status.slice(1)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                {getStatusIcon(systemStatus.database.status)}
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Database
                  </p>
                  <p
                    className={`text-sm ${
                      getStatusColor(systemStatus.database.status).split(" ")[0]
                    }`}
                  >
                    {systemStatus.database.status.charAt(0).toUpperCase() +
                      systemStatus.database.status.slice(1)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                <Cloud className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Environment
                  </p>
                  <p className="text-sm text-secondary-600">
                    {systemStatus.environment?.environment?.toUpperCase() ||
                      "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Environment Configuration - Collapsible */}
          <div className="card">
            <button
              onClick={() => toggleSection("environment")}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <Cloud className="w-6 h-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900">
                  Environment Configuration
                </h3>
              </div>
              {expandedSections.environment ? (
                <ChevronDown className="w-5 h-5 text-secondary-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-secondary-500" />
              )}
            </button>

            {expandedSections.environment && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                    <Monitor className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        Environment
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          systemStatus.environment?.isCloud
                            ? "bg-danger-50 text-danger-700 border-danger-200"
                            : "bg-success-50 text-success-700 border-success-200"
                        }`}
                      >
                        {systemStatus.environment?.environment?.toUpperCase() ||
                          "UNKNOWN"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                    <Zap className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        Cloud Provider
                      </p>
                      <p className="text-sm text-secondary-600 capitalize">
                        {systemStatus.environment?.cloudProvider || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                    <Database className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        Database
                      </p>
                      <p className="text-sm text-secondary-600">
                        {systemStatus.environment?.database?.type?.toUpperCase() ||
                          "UNKNOWN"}
                        {systemStatus.environment?.database?.isLocal
                          ? " (Local)"
                          : " (Cloud)"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                    <Globe className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        CORS Origins
                      </p>
                      <p className="text-sm text-secondary-600">
                        {systemStatus.environment?.cors?.count || 0} origins
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service URLs */}
                <div className="p-4 rounded-lg bg-secondary-50">
                  <h4 className="text-sm font-medium text-secondary-900 mb-3">
                    Service URLs
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-secondary-600 mb-1">
                        Frontend
                      </p>
                      <p className="text-sm font-mono text-secondary-900">
                        {systemStatus.environment?.services?.frontend
                          ?.effective || "Unknown"}
                      </p>
                      {systemStatus.environment?.services?.frontend?.cloud && (
                        <p className="text-xs text-secondary-500">
                          Cloud:{" "}
                          {systemStatus.environment.services.frontend.cloud}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 mb-1">Backend</p>
                      <p className="text-sm font-mono text-secondary-900">
                        {systemStatus.environment?.services?.backend
                          ?.effective || "Unknown"}
                      </p>
                      {systemStatus.environment?.services?.backend?.cloud && (
                        <p className="text-xs text-secondary-500">
                          Cloud:{" "}
                          {systemStatus.environment.services.backend.cloud}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowEnvSwitcher(true)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Switch Environment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Service Status - Collapsible */}
          <div className="card">
            <button
              onClick={() => toggleSection("services")}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900">
                  Service Status
                </h3>
              </div>
              {expandedSections.services ? (
                <ChevronDown className="w-5 h-5 text-secondary-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-secondary-500" />
              )}
            </button>

            {expandedSections.services && (
              <div className="mt-4 space-y-4">
                {/* Backend Details */}
                <div className="p-4 rounded-lg bg-secondary-50">
                  <h4 className="text-sm font-medium text-secondary-900 mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Backend Service
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(systemStatus.backend.status)}
                      <div>
                        <p className="text-sm font-medium text-secondary-900">
                          Status
                        </p>
                        <p
                          className={`text-sm ${
                            getStatusColor(systemStatus.backend.status).split(
                              " "
                            )[0]
                          }`}
                        >
                          {systemStatus.backend.status.charAt(0).toUpperCase() +
                            systemStatus.backend.status.slice(1)}
                        </p>
                      </div>
                    </div>
                    {systemStatus.backend.responseTime && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-secondary-500" />
                        <div>
                          <p className="text-sm font-medium text-secondary-900">
                            Response Time
                          </p>
                          <p className="text-sm text-secondary-600">
                            {systemStatus.backend.responseTime}ms
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-secondary-500" />
                      <div>
                        <p className="text-sm font-medium text-secondary-900">
                          Last Checked
                        </p>
                        <p className="text-sm text-secondary-600">
                          {systemStatus.backend.lastChecked.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Details */}
                <div className="p-4 rounded-lg bg-secondary-50">
                  <h4 className="text-sm font-medium text-secondary-900 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Database Service
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(systemStatus.database.status)}
                      <div>
                        <p className="text-sm font-medium text-secondary-900">
                          Connection
                        </p>
                        <p
                          className={`text-sm ${
                            getStatusColor(systemStatus.database.status).split(
                              " "
                            )[0]
                          }`}
                        >
                          {systemStatus.database.status
                            .charAt(0)
                            .toUpperCase() +
                            systemStatus.database.status.slice(1)}
                        </p>
                      </div>
                    </div>
                    {systemStatus.systemInfo?.database && (
                      <>
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-secondary-500" />
                          <div>
                            <p className="text-sm font-medium text-secondary-900">
                              Users
                            </p>
                            <p className="text-sm text-secondary-600">
                              {systemStatus.systemInfo.database.user_count}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-secondary-500" />
                          <div>
                            <p className="text-sm font-medium text-secondary-900">
                              Risks
                            </p>
                            <p className="text-sm text-secondary-600">
                              {systemStatus.systemInfo.database.risk_count}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-secondary-500" />
                      <div>
                        <p className="text-sm font-medium text-secondary-900">
                          Last Checked
                        </p>
                        <p className="text-sm text-secondary-600">
                          {systemStatus.database.lastChecked.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DB Target Indicator */}
                  <div className="mt-4 p-3 rounded-lg bg-white border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Cloud className="w-4 h-4 text-primary-600" />
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            dbLabel === "Neon Cloud"
                              ? "bg-primary-50 text-primary-700 border-primary-200"
                              : dbLabel.includes("Local")
                              ? "bg-success-50 text-success-700 border-success-200"
                              : "bg-secondary-50 text-secondary-700 border-secondary-200"
                          }`}
                        >
                          {dbLabel}
                        </span>
                      </div>
                      <code className="text-xs font-mono text-secondary-700 bg-secondary-100 px-2 py-1 rounded">
                        {engineHost || "Unknown host"}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Port Status - Collapsible */}
          <div className="card">
            <button
              onClick={() => toggleSection("ports")}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900">
                  Port Status
                </h3>
              </div>
              {expandedSections.ports ? (
                <ChevronDown className="w-5 h-5 text-secondary-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-secondary-500" />
              )}
            </button>

            {expandedSections.ports && (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-sm font-medium text-secondary-600">
                          Port
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-secondary-600">
                          Service
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-secondary-600">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-secondary-600">
                          Process Info
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-secondary-600">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {systemStatus.ports.map((port) => (
                        <tr key={port.port} className="hover:bg-secondary-50">
                          <td className="px-4 py-3">
                            <code className="text-sm font-mono text-secondary-900 bg-secondary-100 px-2 py-1 rounded">
                              {port.port}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-secondary-900">
                            {port.service}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                port.status
                              )}`}
                            >
                              {getStatusIcon(port.status)}
                              {port.status.charAt(0).toUpperCase() +
                                port.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">
                            {(port as any).process ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    PID: {(port as any).process.pid}
                                  </span>
                                  <span className="text-xs text-secondary-500">
                                    {(port as any).process.name}
                                  </span>
                                </div>
                                {(port as any).process.cmdline && (
                                  <div className="text-xs text-secondary-400 font-mono truncate max-w-xs">
                                    {(port as any).process.cmdline}
                                  </div>
                                )}
                                <div className="flex gap-3 text-xs text-secondary-500">
                                  <span>
                                    CPU: {(port as any).process.cpu_percent}%
                                  </span>
                                  <span>
                                    RAM: {(port as any).process.memory_mb}MB
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-secondary-400 italic">
                                {port.status === "active"
                                  ? "Process info unavailable"
                                  : "Not running"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">
                            {port.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-xs text-secondary-500">
                  Last updated: {systemStatus.lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          {/* System Information - Collapsible */}
          <div className="card">
            <button
              onClick={() => toggleSection("system")}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900">
                  System Information
                </h3>
              </div>
              {expandedSections.system ? (
                <ChevronDown className="w-5 h-5 text-secondary-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-secondary-500" />
              )}
            </button>

            {expandedSections.system && (
              <div className="mt-4 space-y-6">
                {/* Two-Column Layout: Frontend Left, Backend Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Frontend Information - Left Side */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h4 className="text-md font-semibold text-secondary-900">
                        Frontend
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-secondary-600 mb-1">URL</p>
                        <p className="text-sm font-mono text-secondary-900">
                          {window.location.origin}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-600 mb-1">
                          Platform
                        </p>
                        <p className="text-sm text-secondary-900 capitalize">
                          {import.meta.env.VITE_DEPLOYMENT_PLATFORM ||
                            (import.meta.env.PROD ? "cloud" : "local")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-600 mb-1">
                          Environment
                        </p>
                        <p className="text-sm text-secondary-900 capitalize">
                          {import.meta.env.PROD ? "production" : "development"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Backend Information - Right Side */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Server className="w-5 h-5 text-green-600" />
                      <h4 className="text-md font-semibold text-secondary-900">
                        Backend
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-secondary-600 mb-1">URL</p>
                        <p className="text-sm font-mono text-secondary-900">
                          {systemStatus.environment?.services?.backend
                            ?.effective || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-600 mb-1">
                          Database
                        </p>
                        <p className="text-sm text-secondary-900">
                          {systemStatus.systemInfo?.database?.type?.toUpperCase() ||
                            "Unknown"}
                          {systemStatus.systemInfo?.database?.engine
                            ? ` (${
                                systemStatus.systemInfo.database.engine
                                  .split("://")[1]
                                  ?.split("/")
                                  .pop() || "Unknown"
                              })`
                            : " (Unknown)"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-600 mb-1">
                          Platform
                        </p>
                        <p className="text-sm text-secondary-900 capitalize">
                          {systemStatus.environment?.cloudProvider || "unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-600 mb-1">
                          Environment
                        </p>
                        <p className="text-sm text-secondary-900 capitalize">
                          {systemStatus.environment?.environment || "unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Environment Toggle Controls */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-secondary-900 mb-4">
                    Environment Controls
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Frontend Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <h5 className="text-sm font-medium text-secondary-900">
                          Frontend Environment
                        </h5>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Current Frontend State - Not a button */}
                        <div className="px-3 py-2 text-xs rounded-md bg-blue-50 border border-blue-200 text-blue-800">
                          Current: {import.meta.env.PROD ? "Cloud" : "Local"}
                        </div>

                        {/* Frontend Platform Options - always visible */}
                        <button
                          className={`px-2 py-1 text-xs rounded border ${
                            (!import.meta.env.PROD ||
                              import.meta.env.VITE_DEPLOYMENT_PLATFORM === "local" ||
                              (typeof window !== "undefined" &&
                                !window.location.host.includes("vercel.app") &&
                                !window.location.host.includes("netlify.app")))
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => handleFrontendSwitch("local")}
                          disabled={switchingFrontend}
                        >
                          {switchingFrontend ? "Switching..." : "Local"}
                        </button>
                        <button
                          className={`px-2 py-1 text-xs rounded border ${
                            (import.meta.env.VITE_DEPLOYMENT_PLATFORM === "vercel" ||
                              (typeof window !== "undefined" &&
                                window.location.host.includes("vercel.app")))
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => handleFrontendSwitch("vercel")}
                          disabled={switchingFrontend}
                        >
                          Vercel
                        </button>
                        <button
                          className={`px-2 py-1 text-xs rounded border ${
                            (import.meta.env.VITE_DEPLOYMENT_PLATFORM === "netlify" ||
                              (typeof window !== "undefined" &&
                                window.location.host.includes("netlify.app")))
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => handleFrontendSwitch("netlify")}
                          disabled={switchingFrontend}
                        >
                          Netlify
                        </button>
                      </div>

                      <p className="text-xs text-secondary-500">
                        Current:{" "}
                        {import.meta.env.PROD
                          ? "Cloud (Vercel/Netlify)"
                          : "Local (localhost:5173)"}
                      </p>
                    </div>

                    {/* Backend Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-green-600" />
                        <h5 className="text-sm font-medium text-secondary-900">
                          Backend Environment
                        </h5>
                      </div>

                      <div className="flex gap-2">
                        {/* Current Backend State - Not a button */}
                        <div className="px-3 py-2 text-xs rounded-md bg-green-50 border border-green-200 text-green-800">
                          Current:{" "}
                          {systemStatus.environment?.isCloud
                            ? "Cloud"
                            : "Local"}
                        </div>

                        {/* Backend Platform Options */}
                        <div className="flex gap-1">
                          <button
                            className={`px-2 py-1 text-xs rounded border ${
                              systemStatus.environment?.isCloud
                                ? "bg-green-100 border-green-300 text-green-700"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                            onClick={() => handleBackendSwitch("render")}
                            disabled={
                              switchingBackend ||
                              systemStatus.environment?.isCloud
                            }
                          >
                            {switchingBackend
                              ? "Switching..."
                              : "Cloud (Render)"}
                          </button>
                          <button
                            className={`px-2 py-1 text-xs rounded border ${
                              !systemStatus.environment?.isCloud
                                ? "bg-green-100 border-green-300 text-green-700"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                            onClick={() => handleBackendSwitch("local")}
                            disabled={
                              switchingBackend ||
                              !systemStatus.environment?.isCloud
                            }
                          >
                            {switchingBackend ? "Switching..." : "Local"}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-secondary-500">
                        Current:{" "}
                        {systemStatus.environment?.isCloud
                          ? "Cloud (Render)"
                          : "Local (localhost:8000)"}
                      </p>
                    </div>
                  </div>

                  {/* Switch Status Message */}
                  {switchMessage && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-sm text-blue-800 whitespace-pre-line">
                          {switchMessage}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            className="px-2 py-1 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => refreshStatus()}
                          >
                            Refresh status
                          </button>
                          <button
                            className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={() => setSwitchMessage(null)}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deployment Information - Two Column Layout */}
                {deploymentInfo && (
                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold text-secondary-900 mb-4">
                      Deployment Information
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Frontend Deployment - Left Side */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Globe className="w-5 h-5 text-blue-600" />
                          <h5 className="text-md font-semibold text-secondary-900">
                            Frontend Deployment
                          </h5>
                        </div>

                        <div className="p-4 rounded-lg bg-secondary-50 border">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Version
                              </p>
                              <div className="space-y-1">
                                <p className="text-sm font-mono text-secondary-900">
                                  {deploymentInfo.frontend?.version
                                    ?.short_hash ||
                                    deploymentInfo.version?.short_hash ||
                                    "Unknown"}
                                </p>
                                <p className="text-xs text-secondary-500 truncate">
                                  {deploymentInfo.frontend?.version
                                    ?.commit_message ||
                                    deploymentInfo.version?.commit_message ||
                                    "No message"}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Platform
                              </p>
                              <p className="text-sm text-secondary-900 capitalize">
                                {deploymentInfo.frontend?.deployment
                                  ?.platform ||
                                  import.meta.env.VITE_DEPLOYMENT_PLATFORM ||
                                  (import.meta.env.VITE_FRONTEND_URL?.includes(
                                    "vercel.app"
                                  )
                                    ? "vercel"
                                    : import.meta.env.VITE_FRONTEND_URL?.includes(
                                        "netlify.app"
                                      )
                                    ? "netlify"
                                    : import.meta.env.PROD
                                    ? "cloud"
                                    : "local")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Environment
                              </p>
                              <p className="text-sm text-secondary-900 capitalize">
                                {deploymentInfo.frontend?.deployment
                                  ?.environment ||
                                  deploymentInfo.deployment?.environment ||
                                  (import.meta.env.PROD
                                    ? "production"
                                    : "development")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Deployed
                              </p>
                              <p className="text-sm text-secondary-900">
                                {deploymentInfo.frontend?.deployment
                                  ?.deployment_time
                                  ? new Date(
                                      deploymentInfo.frontend.deployment.deployment_time
                                    ).toLocaleString()
                                  : deploymentInfo.deployment?.deployment_time
                                  ? new Date(
                                      deploymentInfo.deployment.deployment_time
                                    ).toLocaleString()
                                  : "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                URL
                              </p>
                              <p className="text-sm font-mono text-secondary-900">
                                {deploymentInfo.frontend?.deployment?.url ||
                                  import.meta.env.VITE_FRONTEND_URL ||
                                  (import.meta.env.PROD
                                    ? "https://riskworks.netlify.app"
                                    : "http://localhost:5173")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Node.js
                              </p>
                              <p className="text-sm text-secondary-900">
                                {deploymentInfo.frontend?.build?.node_version ||
                                  "22"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Backend Deployment - Right Side */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Server className="w-5 h-5 text-green-600" />
                          <h5 className="text-md font-semibold text-secondary-900">
                            Backend Deployment
                          </h5>
                        </div>

                        <div className="p-4 rounded-lg bg-secondary-50 border">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Version
                              </p>
                              <div className="space-y-1">
                                <p className="text-sm font-mono text-secondary-900">
                                  {deploymentInfo.backend?.version
                                    ?.short_hash ||
                                    deploymentInfo.version?.short_hash ||
                                    "Unknown"}
                                </p>
                                <p className="text-xs text-secondary-500 truncate">
                                  {deploymentInfo.backend?.version
                                    ?.commit_message ||
                                    deploymentInfo.version?.commit_message ||
                                    "No message"}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Platform
                              </p>
                              <p className="text-sm text-secondary-900 capitalize">
                                {deploymentInfo.backend?.deployment?.platform ||
                                  deploymentInfo.deployment?.platform ||
                                  "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Environment
                              </p>
                              <p className="text-sm text-secondary-900 capitalize">
                                {deploymentInfo.backend?.deployment
                                  ?.environment ||
                                  deploymentInfo.deployment?.environment ||
                                  "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Deployed
                              </p>
                              <p className="text-sm text-secondary-900">
                                {deploymentInfo.backend?.deployment
                                  ?.deployment_time
                                  ? new Date(
                                      deploymentInfo.backend.deployment.deployment_time
                                    ).toLocaleString()
                                  : deploymentInfo.deployment?.deployment_time
                                  ? new Date(
                                      deploymentInfo.deployment.deployment_time
                                    ).toLocaleString()
                                  : "Unknown"}
                              </p>
                            </div>
                            {(deploymentInfo.backend?.deployment?.service_id ||
                              deploymentInfo.deployment?.service_id) &&
                              (deploymentInfo.backend?.deployment
                                ?.service_id !== "unknown" ||
                                deploymentInfo.deployment?.service_id !==
                                  "unknown") && (
                                <div>
                                  <p className="text-xs text-secondary-600 mb-1">
                                    Service ID
                                  </p>
                                  <p className="text-sm font-mono text-secondary-900">
                                    {deploymentInfo.backend?.deployment
                                      ?.service_id ||
                                      deploymentInfo.deployment?.service_id}
                                  </p>
                                </div>
                              )}
                            <div>
                              <p className="text-xs text-secondary-600 mb-1">
                                Python
                              </p>
                              <p className="text-sm text-secondary-900">
                                {deploymentInfo.backend?.build
                                  ?.python_version ||
                                  deploymentInfo.build?.python_version ||
                                  "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <SettingsIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Preferences Coming Soon
            </h3>
            <p className="text-secondary-600">
              User preferences and configuration options will be available here.
            </p>
          </div>
        </div>
      )}

      {/* Environment Switcher Modal */}
      {showEnvSwitcher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-secondary-900">
                  Switch Environment
                </h2>
                <button
                  onClick={() => setShowEnvSwitcher(false)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Environment */}
                <div className="p-4 rounded-lg bg-secondary-50 border">
                  <h3 className="font-medium text-secondary-900 mb-2">
                    Current Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-secondary-600">Environment:</span>
                      <span className="ml-2 font-medium capitalize">
                        {systemStatus.environment?.environment}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Provider:</span>
                      <span className="ml-2 font-medium capitalize">
                        {systemStatus.environment?.cloudProvider}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Database:</span>
                      <span className="ml-2 font-medium">
                        {systemStatus.environment?.database.type.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-600">Location:</span>
                      <span className="ml-2 font-medium">
                        {systemStatus.environment?.database.isLocal
                          ? "Local"
                          : "Cloud"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simple Switch Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Local Environment */}
                  <div className="p-4 rounded-lg border border-secondary-200 hover:border-primary-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <Monitor className="w-5 h-5 text-primary-600" />
                      <h3 className="font-medium text-secondary-900">
                        Local Development
                      </h3>
                    </div>
                    <p className="text-sm text-secondary-600 mb-4">
                      Switch to local SQLite database and localhost services.
                    </p>
                    <ul className="text-sm text-secondary-600 space-y-1 mb-4">
                      <li>• SQLite database</li>
                      <li>• localhost:8000 backend</li>
                      <li>• localhost:5173 frontend</li>
                    </ul>
                    <button
                      onClick={() => handleSimpleSwitch("local")}
                      disabled={switchingEnv}
                      className="w-full btn-secondary text-sm disabled:opacity-50"
                    >
                      {switchingEnv ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-2" />
                      )}
                      Switch to Local
                    </button>
                  </div>

                  {/* Cloud Environment */}
                  <div className="p-4 rounded-lg border border-secondary-200 hover:border-primary-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <Cloud className="w-5 h-5 text-primary-600" />
                      <h3 className="font-medium text-secondary-900">
                        Cloud Environment
                      </h3>
                    </div>
                    <p className="text-sm text-secondary-600 mb-4">
                      Switch to cloud environment (identical config for now).
                    </p>
                    <ul className="text-sm text-secondary-600 space-y-1 mb-4">
                      <li>• Same SQLite database</li>
                      <li>• Same localhost services</li>
                      <li>• Testing environment switching</li>
                    </ul>
                    <button
                      onClick={() => handleSimpleSwitch("cloud")}
                      disabled={switchingEnv}
                      className="w-full btn-primary text-sm disabled:opacity-50"
                    >
                      {switchingEnv ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Cloud className="w-4 h-4 mr-2" />
                      )}
                      Switch to Cloud
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
