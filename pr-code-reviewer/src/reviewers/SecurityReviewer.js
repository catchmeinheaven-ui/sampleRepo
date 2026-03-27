/**
 * Security-focused code reviewer
 * Identifies security vulnerabilities and potential risks
 */
export class SecurityReviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.patterns = config.patterns || {};
  }

  /**
   * Review file for security issues
   */
  async review(filename, content, extension) {
    const issues = [];

    if (!this.config.enabled) {
      return issues;
    }

    // Check for hardcoded credentials
    if (this.config.checks.includes('hardcoded_credentials')) {
      issues.push(...this.checkHardcodedCredentials(filename, content));
    }

    // Check for SQL injection vulnerabilities
    if (this.config.checks.includes('sql_injection')) {
      issues.push(...this.checkSQLInjection(filename, content));
    }

    // Check for XSS vulnerabilities
    if (this.config.checks.includes('xss_vulnerabilities')) {
      issues.push(...this.checkXSS(filename, content));
    }

    // Check for insecure dependencies
    if (this.config.checks.includes('insecure_dependencies')) {
      issues.push(...this.checkInsecureDependencies(filename, content));
    }

    // Check for sensitive data exposure
    if (this.config.checks.includes('sensitive_data_exposure')) {
      issues.push(...this.checkSensitiveDataExposure(filename, content));
    }

    return issues;
  }

  /**
   * Check for hardcoded credentials
   */
  checkHardcodedCredentials(filename, content) {
    const issues = [];
    const patterns = this.patterns.credentials || [];

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      patterns.forEach((pattern) => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(line)) {
          issues.push({
            type: 'hardcoded_credentials',
            severity: 'critical',
            title: 'Hardcoded credentials detected',
            message: 'Credentials should never be hardcoded in source code. Use environment variables or secure credential management systems.',
            line: index + 1,
            suggestion: 'Move credentials to environment variables or use a secrets management service like AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault.',
            code: line.trim(),
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  checkSQLInjection(filename, content) {
    const issues = [];
    const patterns = this.patterns.sql_injection || [];

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      patterns.forEach((pattern) => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(line)) {
          issues.push({
            type: 'sql_injection',
            severity: 'critical',
            title: 'Potential SQL injection vulnerability',
            message: 'SQL queries constructed with string concatenation are vulnerable to SQL injection attacks.',
            line: index + 1,
            suggestion: 'Use parameterized queries or prepared statements instead of string concatenation.',
            code: line.trim(),
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check for XSS vulnerabilities
   */
  checkXSS(filename, content) {
    const issues = [];
    const patterns = this.patterns.xss || [];

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      patterns.forEach((pattern) => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(line)) {
          issues.push({
            type: 'xss_vulnerability',
            severity: 'high',
            title: 'Potential XSS vulnerability',
            message: 'Direct DOM manipulation with user input can lead to XSS attacks.',
            line: index + 1,
            suggestion: 'Sanitize user input and use safe DOM manipulation methods. Consider using a framework that automatically escapes content.',
            code: line.trim(),
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check for insecure dependencies
   */
  checkInsecureDependencies(filename, content) {
    const issues = [];

    // Check package.json for known vulnerable packages
    if (filename.endsWith('package.json')) {
      try {
        const packageData = JSON.parse(content);
        const dependencies = {
          ...packageData.dependencies,
          ...packageData.devDependencies,
        };

        // List of known vulnerable patterns (simplified example)
        const vulnerablePatterns = [
          { name: 'lodash', version: /^[0-3]\./, severity: 'high' },
          { name: 'moment', version: /^2\.[0-9]\./, severity: 'medium' },
        ];

        Object.entries(dependencies).forEach(([name, version]) => {
          vulnerablePatterns.forEach((pattern) => {
            if (name === pattern.name && pattern.version.test(version)) {
              issues.push({
                type: 'insecure_dependency',
                severity: pattern.severity,
                title: `Potentially vulnerable dependency: ${name}`,
                message: `The package ${name}@${version} may have known security vulnerabilities.`,
                line: 1,
                suggestion: `Update ${name} to the latest stable version. Run 'npm audit' for detailed vulnerability information.`,
              });
            }
          });
        });
      } catch (error) {
        this.logger.error('Error parsing package.json:', error);
      }
    }

    return issues;
  }

  /**
   * Check for sensitive data exposure
   */
  checkSensitiveDataExposure(filename, content) {
    const issues = [];

    // Check for console.log with sensitive data
    const sensitiveKeywords = ['password', 'token', 'secret', 'key', 'credential', 'auth'];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (/console\.(log|debug|info|warn|error)/.test(line)) {
        sensitiveKeywords.forEach((keyword) => {
          if (new RegExp(keyword, 'i').test(line)) {
            issues.push({
              type: 'sensitive_data_logging',
              severity: 'high',
              title: 'Potential sensitive data in logs',
              message: `Logging statement may contain sensitive data (${keyword}).`,
              line: index + 1,
              suggestion: 'Remove or redact sensitive information from log statements. Use proper logging levels and avoid logging credentials.',
              code: line.trim(),
            });
          }
        });
      }
    });

    // Check for exposed API keys in URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    lines.forEach((line, index) => {
      const urls = line.match(urlPattern);
      if (urls) {
        urls.forEach((url) => {
          if (/[?&](api[_-]?key|token|secret)=/i.test(url)) {
            issues.push({
              type: 'exposed_api_key',
              severity: 'critical',
              title: 'API key exposed in URL',
              message: 'API keys should not be included in URLs as they may be logged or cached.',
              line: index + 1,
              suggestion: 'Use headers or request body for authentication tokens. Never include credentials in URLs.',
              code: line.trim(),
            });
          }
        });
      }
    });

    return issues;
  }
}

// Made with Bob
