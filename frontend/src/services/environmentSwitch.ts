import { apiClient } from "./api";
import axios from "axios";

export interface EnvironmentConfig {
  frontend: {
    platform: "vercel" | "netlify" | "local";
    url: string;
    environment: "production" | "development";
  };
  backend: {
    platform: "render" | "local";
    url: string;
    environment: "production" | "development";
  };
}

export interface SwitchResult {
  success: boolean;
  message: string;
  requiresRestart?: boolean;
  newConfig?: EnvironmentConfig;
}

class EnvironmentSwitchService {
  private currentConfig: EnvironmentConfig | null = null;

  // Get current environment configuration
  async getCurrentConfig(): Promise<EnvironmentConfig> {
    try {
      const response = await apiClient.get("/system/config");
      const config = response.data;

      this.currentConfig = {
        frontend: {
          platform: import.meta.env.PROD
            ? (import.meta.env.VITE_DEPLOYMENT_PLATFORM as
                | "vercel"
                | "netlify") || "netlify"
            : "local",
          url: window.location.origin,
          environment: import.meta.env.PROD ? "production" : "development",
        },
        backend: {
          platform: config.isCloud ? "render" : "local",
          url: config.services?.backend?.effective || "http://localhost:8000",
          environment: config.environment || "development",
        },
      };

      return this.currentConfig;
    } catch (error) {
      console.error("Failed to get current config:", error);
      throw new Error("Unable to determine current environment configuration");
    }
  }

  // Switch frontend environment
  async switchFrontend(
    targetPlatform: "vercel" | "netlify" | "local"
  ): Promise<SwitchResult> {
    try {
      const currentConfig = await this.getCurrentConfig();

      if (currentConfig.frontend.platform === targetPlatform) {
        return {
          success: true,
          message: `Frontend is already running on ${targetPlatform}`,
          requiresRestart: false,
        };
      }

      // Allow switching in both dev and prod:
      // - local => write .env.local for local
      // - vercel/netlify => write .env.local pointing to cloud backend and platform URL
      if (targetPlatform === "local") {
        return await this.switchToLocalFrontend();
      } else {
        return await this.switchCloudFrontend(targetPlatform);
      }
    } catch (error) {
      console.error("Frontend switch error:", error);
      return {
        success: false,
        message: `Failed to switch frontend: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        requiresRestart: false,
      };
    }
  }

  // Switch backend environment
  async switchBackend(
    targetPlatform: "render" | "local"
  ): Promise<SwitchResult> {
    try {
      const currentConfig = await this.getCurrentConfig();

      if (currentConfig.backend.platform === targetPlatform) {
        return {
          success: true,
          message: `Backend is already running on ${targetPlatform}`,
          requiresRestart: false,
        };
      }

      // Helper: call local backend explicitly to ensure local scripts run
      const callLocalBackend = async () => {
        try {
          const token = localStorage.getItem("token");
          const localApi = axios.create({ baseURL: "http://localhost:8000" });
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;
          const res = await localApi.post(
            "/system/switch-environment",
            { target: targetPlatform },
            { headers, timeout: 3000 }
          );
          return res.data as any;
        } catch (e) {
          return null;
        }
      };

      // Call current backend (Render or Local) and local backend in parallel
      const [localResult, currentResult] = await Promise.all([
        callLocalBackend(),
        apiClient
          .post("/system/switch-environment", { target: targetPlatform })
          .then((r) => r.data)
          .catch(() => null),
      ]);

      const anySuccess =
        (localResult?.success || currentResult?.success) ?? false;
      const requiresRestart =
        localResult?.requires_restart ||
        currentResult?.requires_restart ||
        false;

      if (!anySuccess) {
        return {
          success: false,
          message:
            "Failed to apply switch via backend. Try running the local script manually.",
          requiresRestart: false,
        };
      }

      // Prefer local logs if available, then current backend
      const logs: string[] = [];
      if (localResult?.log) logs.push(String(localResult.log));
      if (localResult?.error) logs.push(String(localResult.error));
      if (currentResult?.log) logs.push(String(currentResult.log));
      if (currentResult?.error) logs.push(String(currentResult.error));

      const instructionsBlocks: string[] = [];
      const addInstr = (obj: any) =>
        obj?.instructions &&
        instructionsBlocks.push(
          Object.values(obj.instructions as Record<string, string>).join("\n")
        );
      addInstr(localResult);
      addInstr(currentResult);

      return {
        success: true,
        message:
          (localResult?.message ||
            currentResult?.message ||
            "Environment switch applied.") +
          (logs.length ? `\n\nLogs:\n${logs.join("\n")}` : ""),
        requiresRestart,
        newConfig: localResult?.new_config || currentResult?.new_config,
        instructions: instructionsBlocks.length
          ? { combined: instructionsBlocks.join("\n\n") }
          : undefined,
      };
    } catch (error) {
      console.error("Backend switch error:", error);
      return {
        success: false,
        message: `Failed to switch backend: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        requiresRestart: false,
      };
    }
  }

  // Switch cloud frontend platform
  private async switchCloudFrontend(
    targetPlatform: "vercel" | "netlify"
  ): Promise<SwitchResult> {
    try {
      // Get configuration template from backend
      const response = await apiClient.post("/config/update-frontend", {
        target: "frontend",
        environment: "cloud",
        platform: targetPlatform,
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          requiresRestart: true,
          instructions: {
            config_generated: `Configuration generated for ${targetPlatform}`,
            file_content: response.data.config_content,
            file_path: response.data.file_path,
            instructions: Object.values(response.data.instructions).join("\n"),
          },
        };
      } else {
        return {
          success: false,
          message:
            response.data.message || `Failed to switch to ${targetPlatform}`,
          requiresRestart: false,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to switch to ${targetPlatform}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        requiresRestart: false,
      };
    }
  }

  // Switch to local frontend
  private async switchToLocalFrontend(): Promise<SwitchResult> {
    try {
      // Get configuration template from backend
      const response = await apiClient.post("/config/update-frontend", {
        target: "frontend",
        environment: "local",
        platform: "local",
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          requiresRestart: true,
          instructions: {
            config_generated: "Configuration generated for local development",
            file_content: response.data.config_content,
            file_path: response.data.file_path,
            instructions: Object.values(response.data.instructions).join("\n"),
          },
        };
      } else {
        return {
          success: false,
          message:
            response.data.message || "Failed to generate local configuration",
          requiresRestart: false,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update frontend configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        requiresRestart: false,
      };
    }
  }

  // Get available frontend platforms
  getAvailableFrontendPlatforms(): Array<{
    value: string;
    label: string;
    available: boolean;
  }> {
    const isProd = import.meta.env.PROD;

    return [
      {
        value: "vercel",
        label: "Vercel",
        available: isProd, // Only available in production
      },
      {
        value: "netlify",
        label: "Netlify",
        available: isProd, // Only available in production
      },
      {
        value: "local",
        label: "Local Development",
        available: true, // Always available
      },
    ];
  }

  // Get available backend platforms
  getAvailableBackendPlatforms(): Array<{
    value: string;
    label: string;
    available: boolean;
  }> {
    return [
      {
        value: "render",
        label: "Render (Cloud)",
        available: true,
      },
      {
        value: "local",
        label: "Local Development",
        available: true,
      },
    ];
  }
}

export const environmentSwitchService = new EnvironmentSwitchService();
