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
  Save,
  RotateCcw,
} from "lucide-react";
import { configService } from "../services/config";

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

interface CloudConfig {
  provider: "railway" | "render" | "aws" | "custom";
  environment: "development" | "staging" | "production";
  databaseUrl: string;
  frontendUrl: string;
  backendUrl: string;
}

interface SystemStatus {
  backend: {
    status: "online" | "offline" | "error";
    responseTime?: number;
    lastChecked: Date;
  };
  database: {
    status: "connected" | "disconnected" | "error";
    lastChecked: Date;
  };
  ports: PortStatus[];
  lastUpdated: Date;
  environment?: EnvironmentConfig;
}

export default function Settings() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    backend: { status: "offline", lastChecked: new Date() },
    database: { status: "disconnected", lastChecked: new Date() },
    ports: [],
    lastUpdated: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "preferences">(
    "status"
  );
  const [showEnvSwitcher, setShowEnvSwitcher] = useState(false);
  const [switchingEnv, setSwitchingEnv] = useState(false);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({
    provider: "railway",
    environment: "development",
    databaseUrl: "",
    frontendUrl: "",
    backendUrl: "",
  });

  // Check backend health and system status
  const checkBackendHealth = async () => {
    try {
      const startTime = Date.now();

      // First check basic health
      const healthResponse = await fetch("http://localhost:8000/health");
      const endTime = Date.now();

      if (healthResponse.ok) {
        // Now get detailed system status
        try {
          const systemResponse = await fetch(
            "http://localhost:8000/system/status",
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (systemResponse.ok) {
            const systemData = await systemResponse.json();
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
    console.log("🔍 Starting port check...");
    try {
      const response = await fetch("http://localhost:8000/system/ports", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("📡 Backend port check response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Backend port check succeeded:", data.ports);

        // Log each port status individually
        data.ports.forEach((port: any) => {
          console.log(`Port ${port.port} (${port.service}): ${port.status}`);
        });
        setSystemStatus((prev) => ({
          ...prev,
          ports: data.ports,
          lastUpdated: new Date(),
        }));
      } else {
        console.log("🔄 Backend port check failed, using frontend fallback");
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
              console.log("Checking Vite dev server on port 5173...");
              try {
                // Vite dev server responds to root path
                console.log("Trying to fetch from Vite root path...");
                const response = await fetch(`http://localhost:${port}/`, {
                  method: "GET",
                  mode: "no-cors",
                });
                console.log("Vite dev server is ACTIVE (root path)");
                return {
                  port,
                  service,
                  status: "active" as const,
                  description,
                };
              } catch (error) {
                console.log("Vite root path failed, trying base URL...");
                // If that fails, try a simple connection test
                try {
                  const response = await fetch(`http://localhost:${port}`, {
                    method: "GET",
                    mode: "no-cors",
                  });
                  console.log("Vite dev server is ACTIVE (base URL)");
                  return {
                    port,
                    service,
                    status: "active" as const,
                    description,
                  };
                } catch (error2) {
                  console.log(
                    "Vite dev server is INACTIVE - both attempts failed:",
                    error2
                  );
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
              const response = await fetch(`http://localhost:${port}/health`, {
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
                const response = await fetch(`http://localhost:${port}`, {
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
      console.log("Backend port check failed, using frontend fallback");
      // The frontend fallback logic is already handled above in the else block
    }
  };

  // Refresh all status checks
  const refreshStatus = async () => {
    setIsLoading(true);
    await Promise.all([
      checkBackendHealth(),
      checkPorts(),
      configService.refreshConfig().then((config) => {
        setSystemStatus((prev) => ({ ...prev, environment: config }));
      }),
    ]);
    setIsLoading(false);
  };

  // Get helpful defaults for cloud providers
  const getCloudDefaults = (provider: string) => {
    switch (provider) {
      case "railway":
        return {
          databaseUrl:
            "postgresql://postgres:password@railway-host.railway.app:5432/railway",
          frontendUrl: "https://your-app.railway.app",
          backendUrl: "https://your-api.railway.app",
        };
      case "render":
        return {
          databaseUrl:
            "postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/dbname",
          frontendUrl: "https://your-app.onrender.com",
          backendUrl: "https://your-api.onrender.com",
        };
      case "aws":
        return {
          databaseUrl:
            "postgresql://user:password@rds.amazonaws.com:5432/dbname",
          frontendUrl: "https://your-app.s3-website.amazonaws.com",
          backendUrl: "https://api.your-domain.com",
        };
      default:
        return {
          databaseUrl: "postgresql://user:password@your-host:5432/dbname",
          frontendUrl: "https://your-frontend-domain.com",
          backendUrl: "https://your-backend-domain.com",
        };
    }
  };

  // Handle cloud provider change
  const handleProviderChange = (
    provider: "railway" | "render" | "aws" | "custom"
  ) => {
    const defaults = getCloudDefaults(provider);
    setCloudConfig({
      ...cloudConfig,
      provider,
      databaseUrl: cloudConfig.databaseUrl || defaults.databaseUrl,
      frontendUrl: cloudConfig.frontendUrl || defaults.frontendUrl,
      backendUrl: cloudConfig.backendUrl || defaults.backendUrl,
    });
  };

  // Switch to local environment
  const switchToLocal = async () => {
    setSwitchingEnv(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/system/switch-env", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "local" }),
      });

      if (response.ok) {
        await refreshStatus();
        setShowEnvSwitcher(false);
      } else {
        throw new Error("Failed to switch to local environment");
      }
    } catch (error) {
      console.error("Environment switch failed:", error);
      alert("Failed to switch environment. Please try again.");
    } finally {
      setSwitchingEnv(false);
    }
  };

  // Switch to cloud environment
  const switchToCloud = async () => {
    setSwitchingEnv(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/system/switch-env", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "cloud",
          config: cloudConfig,
        }),
      });

      if (response.ok) {
        await refreshStatus();
        setShowEnvSwitcher(false);
      } else {
        throw new Error("Failed to switch to cloud environment");
      }
    } catch (error) {
      console.error("Environment switch failed:", error);
      alert(
        "Failed to switch environment. Please check your configuration and try again."
      );
    } finally {
      setSwitchingEnv(false);
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
          {/* Backend Status */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Backend Status
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                {getStatusIcon(systemStatus.backend.status)}
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Status
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
              {systemStatus.backend.responseTime && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
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
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
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

          {/* Database Status */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Database Status
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                {getStatusIcon(systemStatus.database.status)}
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Connection
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
              {systemStatus.systemInfo?.database && (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
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
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
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
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
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
          </div>

          {/* Port Status */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Port Status
              </h3>
            </div>
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

          {/* Environment Configuration */}
          {systemStatus.environment && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Environment Configuration
                  </h3>
                </div>
                <button
                  onClick={() => setShowEnvSwitcher(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Switch Environment
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                  <Monitor className="w-5 h-5 text-secondary-500" />
                  <div>
                    <p className="text-sm font-medium text-secondary-900">
                      Environment
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        systemStatus.environment.isCloud
                          ? "bg-danger-50 text-danger-700 border-danger-200"
                          : "bg-success-50 text-success-700 border-success-200"
                      }`}
                    >
                      {systemStatus.environment.environment.toUpperCase()}
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
                      {systemStatus.environment.cloudProvider}
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
                      {systemStatus.environment.database.type.toUpperCase()}
                      {systemStatus.environment.database.isLocal
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
                      {systemStatus.environment.cors.count} origins
                    </p>
                  </div>
                </div>
              </div>

              {/* Service URLs */}
              <div className="mt-4 p-4 rounded-lg bg-secondary-50">
                <h4 className="text-sm font-medium text-secondary-900 mb-3">
                  Service URLs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-secondary-600 mb-1">Frontend</p>
                    <p className="text-sm font-mono text-secondary-900">
                      {systemStatus.environment.services.frontend.effective}
                    </p>
                    {systemStatus.environment.services.frontend.cloud && (
                      <p className="text-xs text-secondary-500">
                        Cloud:{" "}
                        {systemStatus.environment.services.frontend.cloud}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-secondary-600 mb-1">Backend</p>
                    <p className="text-sm font-mono text-secondary-900">
                      {systemStatus.environment.services.backend.effective}
                    </p>
                    {systemStatus.environment.services.backend.cloud && (
                      <p className="text-xs text-secondary-500">
                        Cloud: {systemStatus.environment.services.backend.cloud}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Info */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                System Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                <Globe className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Frontend URL
                  </p>
                  <p className="text-sm text-secondary-600">
                    {window.location.origin}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                <Server className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Backend URL
                  </p>
                  <p className="text-sm text-secondary-600">
                    http://localhost:8000
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
                    SQLite (risk_platform.db)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50">
                <Activity className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Auto-refresh
                  </p>
                  <p className="text-sm text-secondary-600">Every 30 seconds</p>
                </div>
              </div>
            </div>
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

                {/* Switch Options */}
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
                      onClick={switchToLocal}
                      disabled={
                        switchingEnv || !systemStatus.environment?.isCloud
                      }
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
                        Cloud Deployment
                      </h3>
                    </div>
                    <p className="text-sm text-secondary-600 mb-4">
                      Configure cloud provider settings for deployment.
                    </p>

                    {/* Cloud Configuration Form */}
                    <div className="space-y-4">
                      {/* Provider Selection */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Cloud Provider
                        </label>
                        <select
                          value={cloudConfig.provider}
                          onChange={(e) =>
                            handleProviderChange(e.target.value as any)
                          }
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                        >
                          <option value="railway">Railway</option>
                          <option value="render">Render</option>
                          <option value="aws">AWS</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {/* Environment */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Environment
                        </label>
                        <select
                          value={cloudConfig.environment}
                          onChange={(e) =>
                            setCloudConfig({
                              ...cloudConfig,
                              environment: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                        >
                          <option value="development">Development</option>
                          <option value="staging">Staging</option>
                          <option value="production">Production</option>
                        </select>
                      </div>

                      {/* Database URL */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          PostgreSQL Database URL
                        </label>
                        <input
                          type="text"
                          value={cloudConfig.databaseUrl}
                          onChange={(e) =>
                            setCloudConfig({
                              ...cloudConfig,
                              databaseUrl: e.target.value,
                            })
                          }
                          placeholder={
                            getCloudDefaults(cloudConfig.provider).databaseUrl
                          }
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                        <p className="text-xs text-secondary-500 mt-1">
                          Example:{" "}
                          {getCloudDefaults(cloudConfig.provider).databaseUrl}
                        </p>
                      </div>

                      {/* Frontend URL */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Frontend URL
                        </label>
                        <input
                          type="text"
                          value={cloudConfig.frontendUrl}
                          onChange={(e) =>
                            setCloudConfig({
                              ...cloudConfig,
                              frontendUrl: e.target.value,
                            })
                          }
                          placeholder={
                            getCloudDefaults(cloudConfig.provider).frontendUrl
                          }
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                      </div>

                      {/* Backend URL */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Backend API URL
                        </label>
                        <input
                          type="text"
                          value={cloudConfig.backendUrl}
                          onChange={(e) =>
                            setCloudConfig({
                              ...cloudConfig,
                              backendUrl: e.target.value,
                            })
                          }
                          placeholder={
                            getCloudDefaults(cloudConfig.provider).backendUrl
                          }
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      onClick={switchToCloud}
                      disabled={
                        switchingEnv ||
                        !cloudConfig.databaseUrl ||
                        !cloudConfig.frontendUrl ||
                        !cloudConfig.backendUrl
                      }
                      className="w-full btn-primary text-sm mt-4 disabled:opacity-50"
                    >
                      {switchingEnv ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Switch to Cloud
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div className="p-4 rounded-lg bg-warning-50 border border-warning-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-warning-800">
                        Important Notes
                      </h4>
                      <ul className="text-sm text-warning-700 mt-1 space-y-1">
                        <li>
                          • Switching environments will restart the backend
                          service
                        </li>
                        <li>
                          • Make sure your cloud database is accessible and
                          credentials are correct
                        </li>
                        <li>
                          • Test the connection after switching to ensure
                          everything works
                        </li>
                        <li>
                          • You can always switch back to local development
                        </li>
                      </ul>
                    </div>
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
