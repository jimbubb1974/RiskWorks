/**
 * Configuration service for managing environment settings
 */

export interface EnvironmentConfig {
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

class ConfigService {
  private config: EnvironmentConfig | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get the current environment configuration
   */
  async getConfig(): Promise<EnvironmentConfig> {
    const now = Date.now();

    // Return cached config if still valid
    if (this.config && now - this.lastFetch < this.CACHE_DURATION) {
      return this.config;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${this.getBackendUrl()}/system/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const data = await response.json();

      // Transform backend response to frontend format
      this.config = {
        environment: data.environment.current,
        isCloud: data.environment.is_cloud,
        cloudProvider: data.environment.cloud_provider,
        database: {
          type: data.database.type,
          isLocal: data.database.is_local,
        },
        services: {
          frontend: {
            local: data.services.frontend.local,
            cloud: data.services.frontend.cloud || undefined,
            effective: data.services.frontend.effective,
          },
          backend: {
            local: data.services.backend.local,
            cloud: data.services.backend.cloud || undefined,
            effective: data.services.backend.effective,
          },
        },
        cors: {
          origins: data.cors.origins,
          count: data.cors.count,
        },
      };

      this.lastFetch = now;
      return this.config;
    } catch (error) {
      console.warn(
        "Failed to fetch environment config, using defaults:",
        error
      );

      // Return default local configuration
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default local configuration
   */
  private getDefaultConfig(): EnvironmentConfig {
    return {
      environment: "development",
      isCloud: false,
      cloudProvider: "local",
      database: {
        type: "sqlite",
        isLocal: true,
      },
      services: {
        frontend: {
          local: "http://localhost:5173",
          effective: "http://localhost:5173",
        },
        backend: {
          local: "http://localhost:8000",
          effective: "http://localhost:8000",
        },
      },
      cors: {
        origins: ["http://localhost:5173", "http://127.0.0.1:5173"],
        count: 2,
      },
    };
  }

  /**
   * Get the effective backend URL for API calls
   */
  getBackendUrl(): string {
    // Try to get from config first
    if (this.config?.services.backend.effective) {
      return this.config.services.backend.effective;
    }

    // Fallback to localhost
    return "http://localhost:8000";
  }

  /**
   * Get the effective frontend URL
   */
  getFrontendUrl(): string {
    if (this.config?.services.frontend.effective) {
      return this.config.services.frontend.effective;
    }

    return window.location.origin;
  }

  /**
   * Check if running in cloud environment
   */
  isCloudEnvironment(): boolean {
    return this.config?.isCloud || false;
  }

  /**
   * Get current environment name
   */
  getEnvironment(): string {
    return this.config?.environment || "development";
  }

  /**
   * Get cloud provider name
   */
  getCloudProvider(): string {
    return this.config?.cloudProvider || "local";
  }

  /**
   * Refresh configuration from backend
   */
  async refreshConfig(): Promise<EnvironmentConfig> {
    this.config = null;
    this.lastFetch = 0;
    return this.getConfig();
  }

  /**
   * Get environment badge styling
   */
  getEnvironmentBadgeStyle(): { bg: string; text: string; border: string } {
    const env = this.getEnvironment();

    switch (env) {
      case "production":
        return {
          bg: "bg-danger-50",
          text: "text-danger-700",
          border: "border-danger-200",
        };
      case "staging":
        return {
          bg: "bg-warning-50",
          text: "text-warning-700",
          border: "border-warning-200",
        };
      default:
        return {
          bg: "bg-success-50",
          text: "text-success-700",
          border: "border-success-200",
        };
    }
  }
}

// Export singleton instance
export const configService = new ConfigService();

// Re-export the interface to ensure it's available
// export type { EnvironmentConfig };
