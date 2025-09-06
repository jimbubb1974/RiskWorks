import { apiClient } from './api';

export interface EnvironmentConfig {
  frontend: {
    platform: 'vercel' | 'netlify' | 'local';
    url: string;
    environment: 'production' | 'development';
  };
  backend: {
    platform: 'render' | 'local';
    url: string;
    environment: 'production' | 'development';
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
      const response = await apiClient.get('/system/config');
      const config = response.data;
      
      this.currentConfig = {
        frontend: {
          platform: import.meta.env.PROD 
            ? (import.meta.env.VITE_DEPLOYMENT_PLATFORM as 'vercel' | 'netlify') || 'netlify'
            : 'local',
          url: window.location.origin,
          environment: import.meta.env.PROD ? 'production' : 'development'
        },
        backend: {
          platform: config.isCloud ? 'render' : 'local',
          url: config.services?.backend?.effective || 'http://localhost:8000',
          environment: config.environment || 'development'
        }
      };
      
      return this.currentConfig;
    } catch (error) {
      console.error('Failed to get current config:', error);
      throw new Error('Unable to determine current environment configuration');
    }
  }

  // Switch frontend environment
  async switchFrontend(targetPlatform: 'vercel' | 'netlify' | 'local'): Promise<SwitchResult> {
    try {
      const currentConfig = await this.getCurrentConfig();
      
      if (currentConfig.frontend.platform === targetPlatform) {
        return {
          success: true,
          message: `Frontend is already running on ${targetPlatform}`,
          requiresRestart: false
        };
      }

      // For local development, we can't actually switch to cloud platforms
      if (targetPlatform !== 'local' && !import.meta.env.PROD) {
        return {
          success: false,
          message: 'Cannot switch to cloud platforms from local development. Deploy to cloud first.',
          requiresRestart: false
        };
      }

      // For cloud platforms, we need to trigger a redeploy
      if (targetPlatform !== 'local' && import.meta.env.PROD) {
        return await this.switchCloudFrontend(targetPlatform);
      }

      // For switching to local (from cloud)
      if (targetPlatform === 'local') {
        return await this.switchToLocalFrontend();
      }

      return {
        success: false,
        message: 'Invalid switch operation',
        requiresRestart: false
      };
    } catch (error) {
      console.error('Frontend switch error:', error);
      return {
        success: false,
        message: `Failed to switch frontend: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiresRestart: false
      };
    }
  }

  // Switch backend environment
  async switchBackend(targetPlatform: 'render' | 'local'): Promise<SwitchResult> {
    try {
      const currentConfig = await this.getCurrentConfig();
      
      if (currentConfig.backend.platform === targetPlatform) {
        return {
          success: true,
          message: `Backend is already running on ${targetPlatform}`,
          requiresRestart: false
        };
      }

      // Call backend switch endpoint
      const response = await apiClient.post('/system/switch-environment', {
        target: targetPlatform
      });

      return {
        success: response.data.success,
        message: response.data.message,
        requiresRestart: response.data.requires_restart,
        newConfig: response.data.new_config
      };
    } catch (error) {
      console.error('Backend switch error:', error);
      return {
        success: false,
        message: `Failed to switch backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiresRestart: false
      };
    }
  }

  // Switch cloud frontend platform
  private async switchCloudFrontend(targetPlatform: 'vercel' | 'netlify'): Promise<SwitchResult> {
    try {
      // Get configuration template from backend
      const response = await apiClient.post('/config/update-frontend', {
        target: 'frontend',
        environment: 'cloud',
        platform: targetPlatform
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          requiresRestart: true,
          instructions: {
            'config_generated': `Configuration generated for ${targetPlatform}`,
            'file_content': response.data.config_content,
            'file_path': response.data.file_path,
            'instructions': Object.values(response.data.instructions).join('\n')
          }
        };
      } else {
        return {
          success: false,
          message: response.data.message || `Failed to switch to ${targetPlatform}`,
          requiresRestart: false
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to switch to ${targetPlatform}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiresRestart: false
      };
    }
  }

  // Switch to local frontend
  private async switchToLocalFrontend(): Promise<SwitchResult> {
    try {
      // Get configuration template from backend
      const response = await apiClient.post('/config/update-frontend', {
        target: 'frontend',
        environment: 'local',
        platform: 'local'
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          requiresRestart: true,
          instructions: {
            'config_generated': 'Configuration generated for local development',
            'file_content': response.data.config_content,
            'file_path': response.data.file_path,
            'instructions': Object.values(response.data.instructions).join('\n')
          }
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to generate local configuration',
          requiresRestart: false
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update frontend configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiresRestart: false
      };
    }
  }

  // Get available frontend platforms
  getAvailableFrontendPlatforms(): Array<{value: string, label: string, available: boolean}> {
    const isProd = import.meta.env.PROD;
    
    return [
      {
        value: 'vercel',
        label: 'Vercel',
        available: isProd // Only available in production
      },
      {
        value: 'netlify',
        label: 'Netlify', 
        available: isProd // Only available in production
      },
      {
        value: 'local',
        label: 'Local Development',
        available: true // Always available
      }
    ];
  }

  // Get available backend platforms
  getAvailableBackendPlatforms(): Array<{value: string, label: string, available: boolean}> {
    return [
      {
        value: 'render',
        label: 'Render (Cloud)',
        available: true
      },
      {
        value: 'local',
        label: 'Local Development',
        available: true
      }
    ];
  }
}

export const environmentSwitchService = new EnvironmentSwitchService();
