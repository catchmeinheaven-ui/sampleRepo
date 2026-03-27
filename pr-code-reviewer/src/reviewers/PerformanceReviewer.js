/**
 * Performance-focused code reviewer
 * Identifies performance issues and optimization opportunities
 */
export class PerformanceReviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.thresholds = config.thresholds || {};
  }

  /**
   * Review file for performance issues
   */
  async review(filename, content, extension) {
    const issues = [];

    if (!this.config.enabled) {
      return issues;
    }

    // Check for inefficient loops
    if (this.config.checks.includes('inefficient_loops')) {
      issues.push(...this.checkInefficientLoops(filename, content));
    }

    // Check for blocking operations
    if (this.config.checks.includes('blocking_operations')) {
      issues.push(...this.checkBlockingOperations(filename, content));
    }

    // Check for unnecessary computations
    if (this.config.checks.includes('unnecessary_computations')) {
      issues.push(...this.checkUnnecessaryComputations(filename, content));
    }

    // Check for memory leaks
    if (this.config.checks.includes('memory_leak')) {
      issues.push(...this.checkMemoryLeaks(filename, content, extension));
    }

    return issues;
  }

  /**
   * Check for inefficient loops
   */
  checkInefficientLoops(filename, content) {
    const issues = [];
    const lines = content.split('\n');

    // Check for nested loops
    let loopDepth = 0;
    const loopStack = [];

    lines.forEach((line, index) => {
      // Detect loop start
      if (/\b(for|while|forEach|map|filter|reduce)\b/.test(line)) {
        loopDepth++;
        loopStack.push({ line: index + 1, depth: loopDepth });

        if (loopDepth > (this.thresholds.max_nested_loops || 3)) {
          issues.push({
            type: 'excessive_nesting',
            severity: 'medium',
            title: 'Excessive loop nesting',
            message: `Loop nesting depth of ${loopDepth} exceeds recommended maximum of ${this.thresholds.max_nested_loops || 3}.`,
            line: index + 1,
            suggestion: 'Consider refactoring nested loops into separate functions or using more efficient algorithms.',
            code: line.trim(),
          });
        }
      }

      // Detect loop end (simplified)
      if (line.includes('}') && loopStack.length > 0) {
        loopStack.pop();
        loopDepth = Math.max(0, loopDepth - 1);
      }

      // Check for array operations inside loops
      if (loopDepth > 0 && /\.(push|concat|splice|shift|unshift)\(/.test(line)) {
        issues.push({
          type: 'inefficient_array_operation',
          severity: 'medium',
          title: 'Inefficient array operation in loop',
          message: 'Array operations like push/concat inside loops can be inefficient for large datasets.',
          line: index + 1,
          suggestion: 'Consider pre-allocating array size or using more efficient data structures.',
          code: line.trim(),
        });
      }

      // Check for DOM queries in loops
      if (loopDepth > 0 && /(document\.|querySelector|getElementById|getElementsBy)/.test(line)) {
        issues.push({
          type: 'dom_query_in_loop',
          severity: 'high',
          title: 'DOM query inside loop',
          message: 'DOM queries inside loops can cause significant performance degradation.',
          line: index + 1,
          suggestion: 'Cache DOM references outside the loop.',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  /**
   * Check for blocking operations
   */
  checkBlockingOperations(filename, content) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for synchronous file operations
      if (/fs\.(readFileSync|writeFileSync|existsSync|statSync)/.test(line)) {
        issues.push({
          type: 'blocking_file_operation',
          severity: 'high',
          title: 'Synchronous file operation',
          message: 'Synchronous file operations block the event loop and can cause performance issues.',
          line: index + 1,
          suggestion: 'Use asynchronous file operations (fs.promises or async/await) instead.',
          code: line.trim(),
        });
      }

      // Check for synchronous network requests
      if (/XMLHttpRequest.*open\([^,]*,\s*false/.test(line)) {
        issues.push({
          type: 'synchronous_xhr',
          severity: 'critical',
          title: 'Synchronous XMLHttpRequest',
          message: 'Synchronous XHR requests block the browser and provide poor user experience.',
          line: index + 1,
          suggestion: 'Use asynchronous requests with fetch() or async XMLHttpRequest.',
          code: line.trim(),
        });
      }

      // Check for blocking sleep/wait
      if (/sleep\(|wait\(|Thread\.sleep/.test(line)) {
        issues.push({
          type: 'blocking_sleep',
          severity: 'high',
          title: 'Blocking sleep/wait operation',
          message: 'Blocking sleep operations can cause performance issues and poor responsiveness.',
          line: index + 1,
          suggestion: 'Use non-blocking alternatives like setTimeout, setInterval, or async/await with delays.',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  /**
   * Check for unnecessary computations
   */
  checkUnnecessaryComputations(filename, content) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for repeated calculations in loops
      if (/for\s*\([^;]*;[^;]*\.length/.test(line)) {
        issues.push({
          type: 'repeated_length_calculation',
          severity: 'low',
          title: 'Repeated length calculation in loop',
          message: 'Calculating array length in every loop iteration is inefficient.',
          line: index + 1,
          suggestion: 'Cache the length value before the loop: const len = array.length; for (let i = 0; i < len; i++)',
          code: line.trim(),
        });
      }

      // Check for regex in loops without caching
      if (/new RegExp\(/.test(line)) {
        const nextLines = lines.slice(Math.max(0, index - 5), index + 5).join('\n');
        if (/\b(for|while|forEach)\b/.test(nextLines)) {
          issues.push({
            type: 'regex_in_loop',
            severity: 'medium',
            title: 'RegExp creation in loop context',
            message: 'Creating RegExp objects repeatedly is inefficient.',
            line: index + 1,
            suggestion: 'Define RegExp outside the loop and reuse it.',
            code: line.trim(),
          });
        }
      }

      // Check for unnecessary type conversions
      if (/parseInt\(.*toString\(\)|String\(.*Number\(/.test(line)) {
        issues.push({
          type: 'unnecessary_conversion',
          severity: 'low',
          title: 'Unnecessary type conversion',
          message: 'Multiple type conversions can be optimized.',
          line: index + 1,
          suggestion: 'Simplify type conversions or use the appropriate type from the start.',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  /**
   * Check for potential memory leaks
   */
  checkMemoryLeaks(filename, content, extension) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for event listeners without cleanup
      if (/addEventListener\(/.test(line)) {
        const functionContext = this.getFunctionContext(lines, index);
        if (!functionContext.includes('removeEventListener')) {
          issues.push({
            type: 'missing_event_cleanup',
            severity: 'medium',
            title: 'Event listener without cleanup',
            message: 'Event listeners should be removed to prevent memory leaks.',
            line: index + 1,
            suggestion: 'Add removeEventListener in cleanup/unmount logic or use AbortController.',
            code: line.trim(),
          });
        }
      }

      // Check for setInterval without clearInterval
      if (/setInterval\(/.test(line)) {
        const functionContext = this.getFunctionContext(lines, index);
        if (!functionContext.includes('clearInterval')) {
          issues.push({
            type: 'missing_interval_cleanup',
            severity: 'high',
            title: 'setInterval without clearInterval',
            message: 'Intervals should be cleared to prevent memory leaks and unnecessary processing.',
            line: index + 1,
            suggestion: 'Store the interval ID and call clearInterval in cleanup logic.',
            code: line.trim(),
          });
        }
      }

      // Check for global variable accumulation
      if (/window\.\w+\s*=|global\.\w+\s*=/.test(line)) {
        issues.push({
          type: 'global_variable',
          severity: 'low',
          title: 'Global variable assignment',
          message: 'Global variables can lead to memory leaks and namespace pollution.',
          line: index + 1,
          suggestion: 'Use module scope or proper encapsulation instead of global variables.',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  /**
   * Get function context around a line
   */
  getFunctionContext(lines, lineIndex, contextSize = 20) {
    const start = Math.max(0, lineIndex - contextSize);
    const end = Math.min(lines.length, lineIndex + contextSize);
    return lines.slice(start, end).join('\n');
  }
}

// Made with Bob
