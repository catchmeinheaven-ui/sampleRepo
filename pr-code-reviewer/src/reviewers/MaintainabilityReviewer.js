/**
 * Maintainability-focused code reviewer
 * Identifies code quality and maintainability issues
 */
export class MaintainabilityReviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.standards = config.standards || {};
  }

  /**
   * Review file for maintainability issues
   */
  async review(filename, content, extension) {
    const issues = [];

    if (!this.config.enabled) {
      return issues;
    }

    // Check for long functions
    if (this.config.checks.includes('long_functions')) {
      issues.push(...this.checkLongFunctions(filename, content));
    }

    // Check for complex conditionals
    if (this.config.checks.includes('complex_conditionals')) {
      issues.push(...this.checkComplexConditionals(filename, content));
    }

    // Check for magic numbers
    if (this.config.checks.includes('magic_numbers')) {
      issues.push(...this.checkMagicNumbers(filename, content));
    }

    // Check for poor naming
    if (this.config.checks.includes('poor_naming')) {
      issues.push(...this.checkNaming(filename, content));
    }

    // Check for missing error handling
    if (this.config.checks.includes('missing_error_handling')) {
      issues.push(...this.checkErrorHandling(filename, content));
    }

    // Check for code duplication
    if (this.config.checks.includes('code_duplication')) {
      issues.push(...this.checkDuplication(filename, content));
    }

    return issues;
  }

  /**
   * Check for long functions
   */
  checkLongFunctions(filename, content) {
    const issues = [];
    const lines = content.split('\n');
    const maxLength = this.standards.max_function_length || 50;

    let inFunction = false;
    let functionStart = 0;
    let functionName = '';
    let braceCount = 0;

    lines.forEach((line, index) => {
      // Detect function start
      const functionMatch = line.match(/function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?function|(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?:=>)?\s*\{/);
      if (functionMatch && !inFunction) {
        inFunction = true;
        functionStart = index;
        functionName = functionMatch[1] || functionMatch[2] || functionMatch[3] || 'anonymous';
        braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      } else if (inFunction) {
        braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

        if (braceCount === 0) {
          const functionLength = index - functionStart + 1;
          if (functionLength > maxLength) {
            issues.push({
              type: 'long_function',
              severity: 'medium',
              title: `Function '${functionName}' is too long`,
              message: `Function has ${functionLength} lines, exceeding the recommended maximum of ${maxLength} lines.`,
              line: functionStart + 1,
              suggestion: 'Break down the function into smaller, more focused functions. Each function should have a single responsibility.',
            });
          }
          inFunction = false;
        }
      }
    });

    return issues;
  }

  /**
   * Check for complex conditionals
   */
  checkComplexConditionals(filename, content) {
    const issues = [];
    const lines = content.split('\n');
    const maxNesting = this.standards.max_nesting_depth || 4;

    let nestingLevel = 0;
    const nestingStack = [];

    lines.forEach((line, index) => {
      // Track nesting level
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;

      if (/\b(if|else|for|while|switch)\b/.test(line)) {
        nestingLevel += openBraces;
        nestingStack.push(index);

        if (nestingLevel > maxNesting) {
          issues.push({
            type: 'excessive_nesting',
            severity: 'medium',
            title: 'Excessive nesting depth',
            message: `Nesting depth of ${nestingLevel} exceeds recommended maximum of ${maxNesting}.`,
            line: index + 1,
            suggestion: 'Reduce nesting by using early returns, extracting functions, or simplifying logic.',
            code: line.trim(),
          });
        }
      }

      nestingLevel = Math.max(0, nestingLevel - closeBraces + openBraces);

      // Check for complex boolean expressions
      const andOrCount = (line.match(/&&|\|\|/g) || []).length;
      if (andOrCount > 3) {
        issues.push({
          type: 'complex_condition',
          severity: 'low',
          title: 'Complex boolean expression',
          message: `Boolean expression has ${andOrCount} logical operators, making it hard to understand.`,
          line: index + 1,
          suggestion: 'Break complex conditions into well-named boolean variables or separate functions.',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  /**
   * Check for magic numbers
   */
  checkMagicNumbers(filename, content) {
    const issues = [];
    const lines = content.split('\n');

    // Numbers to ignore (common constants)
    const ignoredNumbers = new Set([0, 1, -1, 2, 10, 100, 1000]);

    lines.forEach((line, index) => {
      // Skip comments and strings
      if (/^\s*(\/\/|\/\*|\*)/.test(line) || /['"`]/.test(line)) {
        return;
      }

      // Find numeric literals
      const numberMatches = line.match(/\b\d+\.?\d*\b/g);
      if (numberMatches) {
        numberMatches.forEach((num) => {
          const numValue = parseFloat(num);
          if (!ignoredNumbers.has(numValue) && !line.includes('const') && !line.includes('let')) {
            issues.push({
              type: 'magic_number',
              severity: 'low',
              title: 'Magic number detected',
              message: `The number ${num} should be defined as a named constant for better maintainability.`,
              line: index + 1,
              suggestion: `Define as a constant: const MEANINGFUL_NAME = ${num};`,
              code: line.trim(),
            });
          }
        });
      }
    });

    return issues;
  }

  /**
   * Check for poor naming conventions
   */
  checkNaming(filename, content) {
    const issues = [];
    const lines = content.split('\n');
    const minLength = this.standards.min_variable_name_length || 3;

    lines.forEach((line, index) => {
      // Check for single-letter variables (except common loop counters)
      const varMatches = line.match(/\b(?:const|let|var)\s+([a-z])\b/g);
      if (varMatches) {
        varMatches.forEach((match) => {
          const varName = match.split(/\s+/)[1];
          if (varName.length < minLength && !['i', 'j', 'k', 'x', 'y', 'z'].includes(varName)) {
            issues.push({
              type: 'poor_naming',
              severity: 'low',
              title: 'Variable name too short',
              message: `Variable '${varName}' is too short. Use descriptive names.`,
              line: index + 1,
              suggestion: 'Use meaningful variable names that describe their purpose.',
              code: line.trim(),
            });
          }
        });
      }

      // Check for unclear abbreviations
      const unclearAbbreviations = ['tmp', 'temp', 'data', 'info', 'obj', 'arr', 'str', 'num'];
      unclearAbbreviations.forEach((abbr) => {
        const regex = new RegExp(`\\b(?:const|let|var)\\s+${abbr}\\b`, 'i');
        if (regex.test(line)) {
          issues.push({
            type: 'unclear_naming',
            severity: 'low',
            title: 'Unclear variable name',
            message: `Variable name '${abbr}' is too generic. Use more descriptive names.`,
            line: index + 1,
            suggestion: 'Choose names that clearly indicate the variable\'s purpose and content.',
            code: line.trim(),
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check for missing error handling
   */
  checkErrorHandling(filename, content) {
    const issues = [];
    const lines = content.split('\n');

    let inAsyncFunction = false;
    let hasTryCatch = false;
    let asyncFunctionStart = 0;

    lines.forEach((line, index) => {
      // Detect async function
      if (/async\s+function|async\s+\(/.test(line)) {
        inAsyncFunction = true;
        asyncFunctionStart = index;
        hasTryCatch = false;
      }

      if (inAsyncFunction && /try\s*\{/.test(line)) {
        hasTryCatch = true;
      }

      // Check for Promise without catch
      if (/\.then\(/.test(line) && !line.includes('.catch(')) {
        const nextLines = lines.slice(index, Math.min(index + 3, lines.length)).join('\n');
        if (!nextLines.includes('.catch(')) {
          issues.push({
            type: 'missing_error_handling',
            severity: 'medium',
            title: 'Promise without error handling',
            message: 'Promise chain should include .catch() for error handling.',
            line: index + 1,
            suggestion: 'Add .catch() to handle potential errors: .then(...).catch(error => { /* handle error */ })',
            code: line.trim(),
          });
        }
      }

      // Check for async/await without try-catch
      if (/await\s+/.test(line) && !hasTryCatch) {
        issues.push({
          type: 'missing_try_catch',
          severity: 'medium',
          title: 'await without try-catch',
          message: 'Async operations should be wrapped in try-catch blocks.',
          line: index + 1,
          suggestion: 'Wrap await calls in try-catch blocks to handle potential errors.',
          code: line.trim(),
        });
      }

      // Reset async function tracking
      if (inAsyncFunction && line.includes('}')) {
        inAsyncFunction = false;
      }
    });

    return issues;
  }

  /**
   * Check for code duplication
   */
  checkDuplication(filename, content) {
    const issues = [];
    const lines = content.split('\n');
    const minDuplicateLines = 5;

    // Simple duplication detection using line hashing
    const lineGroups = new Map();

    for (let i = 0; i < lines.length - minDuplicateLines; i++) {
      const block = lines.slice(i, i + minDuplicateLines)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('//') && !l.startsWith('/*'))
        .join('\n');

      if (block.length > 50) {
        if (lineGroups.has(block)) {
          lineGroups.get(block).push(i + 1);
        } else {
          lineGroups.set(block, [i + 1]);
        }
      }
    }

    lineGroups.forEach((locations, block) => {
      if (locations.length > 1) {
        issues.push({
          type: 'code_duplication',
          severity: 'medium',
          title: 'Duplicated code block detected',
          message: `Code block appears ${locations.length} times at lines: ${locations.join(', ')}`,
          line: locations[0],
          suggestion: 'Extract duplicated code into a reusable function to follow the DRY principle.',
        });
      }
    });

    return issues;
  }
}

// Made with Bob
