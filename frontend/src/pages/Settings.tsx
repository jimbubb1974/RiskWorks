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
} from "lucide-react";

interface PortStatus {
  port: number;
  service: string;
  status: "active" | "inactive" | "error";
  description?: string;
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
    try {
      const response = await fetch("http://localhost:8000/system/ports", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
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
              // Try a different approach for port checking
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
      // Fallback to frontend port checking
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
        { port: 6379, service: "Redis", description: "Redis cache (if using)" },
        {
          port: 8080,
          service: "Alternative Backend",
          description: "Alternative backend port",
        },
      ];

      const portChecks = await Promise.allSettled(
        commonPorts.map(async ({ port, service, description }) => {
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
            // Try a different approach for port checking
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
  };

  // Refresh all status checks
  const refreshStatus = async () => {
    setIsLoading(true);
    await Promise.all([checkBackendHealth(), checkPorts()]);
    setIsLoading(false);
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
    </div>
  );
}
