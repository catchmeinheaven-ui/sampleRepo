/**
 * Style and formatting code reviewer
 * Identifies style inconsistencies and formatting issues
 */
export class StyleReviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.conventions = config.conventions || {};
  }

  /**
   * Review file for style issues
   */
  async review(filename, content, extension) {
    const issues = [];

    if (!this.config.enabled) {
      return issues;
    }

    // Check for inconsistent formatting
    if (this.config.checks.includes('inconsistent_formatting')) {
      issues.push(...this.checkFormatting(filename, content, extension));
    }

    // Check naming conventions
    if (this.config.checks.includes('naming_conventions')) {
      issues.push(...this.checkNamingConventions(filename, content, extension));
    }

    // Check import organization
    if (this.config.checks.includes('import_organization')) {
      issues.push(...this.checkImports(filename, content, extension));
    }

    // Check comment quality
    if (this.config.checks.includes('comment_quality')) {
      issues.push(...this.checkComments(filename, content));
    }

    return issues;
  }

  /**
   * Check formatting consistency
   */
  checkFormatting(filename, content, extension) {
    const issues = [];
    const lines = content.split('\n');
    const convention = this.getConvention(extension);

    // Check indentation consistency
    const indentations = new Map();
    lines.forEach((line, index) => {
      if (line.trim().length === 0) return;

      const leadingSpaces = line.match(/^(\s*)/)[1].length;
      const leadingTabs = line.match(/^(\t*)/)[1].length;

      if (leadingSpaces > 0 && leadingTabs > 0) {
        issues.push({
          type: 'mixed_indentation',
          severity: 'low',
          title: 'Mixed spaces and tabs',
          message: 'Line uses both spaces and tabs for indentation.',
          line: index + 1,
          suggestion: `Use consistent indentation. Recommended: ${convention.indent} spaces.`,
          code: line,
        });
      }

      if (leadingSpaces > 0) {
        indentations.set('spaces', (indentations.get('spaces') || 0) + 1);
      }
      if (leadingTabs > 0) {
        indentations.set('tabs', (indentations.get('tabs') || 0) + 1);
      }
    });

    // Check for trailing whitespace
    lines.forEach((line, index) => {
      if (/\s+$/.test(line)) {
        issues.push({
          type: 'trailing_whitespace',
          severity: 'low',
          title: 'Trailing whitespace',
          message: 'Line has trailing whitespace.',
          line: index + 1,
          suggestion: 'Remove trailing whitespace.',
        });
      }
    });

    // Check line length
    const maxLineLength = 120;
    lines.forEach((line, index) => {
      if (line.length > maxLineLength && !line.trim().startsWith('//')) {
        issues.push({
          type: 'long_line',
          severity: 'low',
          title: 'Line too long',
          message: `Line exceeds ${maxLineLength} characters (${line.length} characters).`,
          line: index + 1,
          suggestion: 'Break long lines into multiple lines for better readability.',
        });
      }
    });

    // Check for multiple blank lines
    let consecutiveBlankLines = 0;
    lines.forEach((line, index) => {
      if (line.trim().length === 0) {
        consecutiveBlankLines++;
        if (consecutiveBlankLines > 2) {
          issues.push({
            type: 'excessive_blank_lines',
            severity: 'low',
            title: 'Too many consecutive blank lines',
            message: 'More than 2 consecutive blank lines found.',
            line: index + 1,
            suggestion: 'Limit consecutive blank lines to 1 or 2.',
          });
        }
      } else {
        consecutiveBlankLines = 0;
      }
    });

    return issues;
  }

  /**
   * Check naming conventions
   */
  checkNamingConventions(filename, content, extension) {
    const issues = [];
    const lines = content.split('\n');
    const convention = this.getConvention(extension);

    lines.forEach((line, index) => {
      // Check function naming
      const functionMatch = line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (functionMatch) {
        const funcName = functionMatch[1];
        if (convention.naming === 'camelCase' && !/^[a-z][a-zA-Z0-9]*$/.test(funcName)) {
          issues.push({
            type: 'naming_convention',
            severity: 'low',
            title: 'Function naming convention violation',
            message: `Function '${funcName}' should use camelCase naming.`,
            line: index + 1,
            suggestion: `Rename to follow camelCase convention, e.g., '${this.toCamelCase(funcName)}'`,
            code: line.trim(),
          });
        }
      }

      // Check class naming
      const classMatch = line.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (classMatch) {
        const className = classMatch[1];
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
          issues.push({
            type: 'naming_convention',
            severity: 'low',
            title: 'Class naming convention violation',
            message: `Class '${className}' should use PascalCase naming.`,
            line: index + 1,
            suggestion: `Rename to follow PascalCase convention, e.g., '${this.toPascalCase(className)}'`,
            code: line.trim(),
          });
        }
      }

      // Check constant naming
      const constMatch = line.match(/const\s+([A-Z_][A-Z0-9_]*)\s*=/);
      if (constMatch) {
        const constName = constMatch[1];
        if (constName.length > 2 && !/^[A-Z][A-Z0-9_]*$/.test(constName)) {
          issues.push({
            type: 'naming_convention',
            severity: 'low',
            title: 'Constant naming convention violation',
            message: `Constant '${constName}' should use UPPER_SNAKE_CASE naming.`,
            line: index + 1,
            suggestion: 'Use UPPER_SNAKE_CASE for constants.',
            code: line.trim(),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Check import organization
   */
  checkImports(filename, content, extension) {
    const issues = [];
    const lines = content.split('\n');

    let lastImportLine = -1;
    let hasNonImportBetweenImports = false;

    lines.forEach((line, index) => {
      const isImport = /^import\s+/.test(line.trim()) || /^from\s+.*import/.test(line.trim());

      if (isImport) {
        if (lastImportLine >= 0 && index > lastImportLine + 1 && hasNonImportBetweenImports) {
          issues.push({
            type: 'scattered_imports',
            severity: 'low',
            title: 'Imports not grouped together',
            message: 'All imports should be grouped at the top of the file.',
            line: index + 1,
            suggestion: 'Move all imports to the top of the file and group them logically.',
            code: line.trim(),
          });
        }
        lastImportLine = index;
        hasNonImportBetweenImports = false;
      } else if (line.trim().length > 0 && !line.trim().startsWith('//') && lastImportLine >= 0) {
        hasNonImportBetweenImports = true;
      }
    });

    return issues;
  }

  /**
   * Check comment quality
   */
  checkComments(filename, content) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check for commented-out code
      if (trimmed.startsWith('//') && /[{};()=]/.test(trimmed)) {
        issues.push({
          type: 'commented_code',
          severity: 'low',
          title: 'Commented-out code',
          message: 'Commented-out code should be removed. Use version control instead.',
          line: index + 1,
          suggestion: 'Remove commented-out code. If needed, it can be retrieved from version control history.',
          code: line.trim(),
        });
      }

      // Check for TODO comments
      if (/\/\/\s*TODO/i.test(trimmed)) {
        issues.push({
          type: 'todo_comment',
          severity: 'low',
          title: 'TODO comment found',
          message: 'TODO comments should be tracked in issue tracker.',
          line: index + 1,
          suggestion: 'Create a ticket in your issue tracker and reference it in the comment.',
          code: line.trim(),
        });
      }

      // Check for unclear comments
      if (trimmed.startsWith('//') && trimmed.length < 10) {
        issues.push({
          type: 'unclear_comment',
          severity: 'low',
          title: 'Comment too short',
          message: 'Comment may be too brief to be useful.',
          line: index + 1,
          suggestion: 'Provide more context in comments to explain why, not what.',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  /**
   * Get convention for file extension
   */
  getConvention(extension) {
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'javascript',
      tsx: 'javascript',
      java: 'java',
      py: 'python',
    };

    const language = languageMap[extension] || 'javascript';
    return this.conventions[language] || { naming: 'camelCase', indent: 2, quotes: 'single' };
  }

  /**
   * Convert to camelCase
   */
  toCamelCase(str) {
    return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }

  /**
   * Convert to PascalCase
   */
  toPascalCase(str) {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }
}

// Made with Bob
