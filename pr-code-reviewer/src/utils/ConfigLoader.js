import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Configuration loader utility
 */
export class ConfigLoader {
  /**
   * Load configuration from YAML file
   */
  static async load(configPath = null) {
    try {
      // Default config path
      const defaultPath = path.join(process.cwd(), 'src/config/review-config.yml');
      const finalPath = configPath || defaultPath;

      // Read and parse YAML file
      const fileContent = await fs.readFile(finalPath, 'utf8');
      const config = yaml.load(fileContent);

      // Merge with environment-specific overrides
      const mergedConfig = this.mergeWithEnvOverrides(config);

      return mergedConfig;
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Return default configuration
      return this.getDefaultConfig();
    }
  }

  /**
   * Merge configuration with environment variable overrides
   */
  static mergeWithEnvOverrides(config) {
    // Allow environment variables to override specific settings
    if (process.env.REVIEW_MIN_SEVERITY) {
      config.review_settings.min_severity_to_comment = process.env.REVIEW_MIN_SEVERITY;
    }

    if (process.env.REVIEW_AUTO_APPROVE === 'true') {
      config.review_settings.auto_approve_on_success = true;
    }

    if (process.env.AI_MODEL) {
      config.ai_review.model = process.env.AI_MODEL;
    }

    if (process.env.ENABLE_SECURITY_CHECK === 'false') {
      config.security.enabled = false;
    }

    if (process.env.ENABLE_PERFORMANCE_CHECK === 'false') {
      config.performance.enabled = false;
    }

    return config;
  }

  /**
   * Get default configuration
   */
  static getDefaultConfig() {
    return {
      review_settings: {
        enabled_checks: ['security', 'performance', 'maintainability', 'style'],
        min_severity_to_comment: 'medium',
        auto_approve_on_success: false,
        request_changes_on_critical: true,
      },
      security: {
        enabled: true,
        checks: [
          'hardcoded_credentials',
          'sql_injection',
          'xss_vulnerabilities',
          'insecure_dependencies',
          'sensitive_data_exposure',
        ],
        patterns: {
          credentials: [
            'password\\s*=\\s*["\'].*["\']',
            'api[_-]?key\\s*=\\s*["\'].*["\']',
            'secret\\s*=\\s*["\'].*["\']',
          ],
          sql_injection: [
            'execute\\s*\\(\\s*["\'].*\\+.*["\']',
            'query\\s*\\(\\s*["\'].*\\+.*["\']',
          ],
          xss: ['innerHTML\\s*=', 'document\\.write\\s*\\(', 'eval\\s*\\('],
        },
      },
      performance: {
        enabled: true,
        checks: [
          'inefficient_loops',
          'memory_leaks',
          'blocking_operations',
          'unnecessary_computations',
        ],
        thresholds: {
          max_function_lines: 100,
          max_file_lines: 500,
          max_complexity: 15,
          max_nested_loops: 3,
        },
      },
      maintainability: {
        enabled: true,
        checks: [
          'code_duplication',
          'long_functions',
          'complex_conditionals',
          'magic_numbers',
          'poor_naming',
          'missing_error_handling',
        ],
        standards: {
          max_function_length: 50,
          max_parameters: 5,
          max_nesting_depth: 4,
          min_variable_name_length: 3,
        },
      },
      style: {
        enabled: true,
        checks: [
          'inconsistent_formatting',
          'naming_conventions',
          'import_organization',
          'comment_quality',
        ],
        conventions: {
          javascript: {
            naming: 'camelCase',
            indent: 2,
            quotes: 'single',
          },
          java: {
            naming: 'camelCase',
            indent: 4,
            quotes: 'double',
          },
        },
      },
      ai_review: {
        enabled: false,
        model: 'gpt-4',
        max_tokens: 4000,
        temperature: 0.3,
      },
      exclusions: {
        paths: [
          'node_modules/**',
          'dist/**',
          'build/**',
          'target/**',
          '*.min.js',
          'test/**',
          'tests/**',
        ],
        file_patterns: ['*.lock', '*.log', '*.md'],
      },
      github: {
        post_comments: true,
        create_review: true,
        add_labels: true,
      },
    };
  }

  /**
   * Validate configuration
   */
  static validate(config) {
    const errors = [];

    // Validate review_settings
    if (!config.review_settings) {
      errors.push('Missing review_settings section');
    }

    // Validate enabled_checks
    const validChecks = ['security', 'performance', 'maintainability', 'style', 'documentation', 'testing'];
    const enabledChecks = config.review_settings?.enabled_checks || [];
    enabledChecks.forEach((check) => {
      if (!validChecks.includes(check)) {
        errors.push(`Invalid check type: ${check}`);
      }
    });

    // Validate severity levels
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    const minSeverity = config.review_settings?.min_severity_to_comment;
    if (minSeverity && !validSeverities.includes(minSeverity)) {
      errors.push(`Invalid severity level: ${minSeverity}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Made with Bob
