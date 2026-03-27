import { SecurityReviewer } from './SecurityReviewer.js';
import { PerformanceReviewer } from './PerformanceReviewer.js';
import { MaintainabilityReviewer } from './MaintainabilityReviewer.js';
import { StyleReviewer } from './StyleReviewer.js';
import { AIReviewer } from './AIReviewer.js';

/**
 * Main code reviewer that orchestrates all review types
 */
export class CodeReviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;

    // Initialize specialized reviewers
    this.reviewers = {
      security: new SecurityReviewer(config.security, logger),
      performance: new PerformanceReviewer(config.performance, logger),
      maintainability: new MaintainabilityReviewer(config.maintainability, logger),
      style: new StyleReviewer(config.style, logger),
    };

    // Initialize AI reviewer if enabled and API key is available
    if (config.ai_review?.enabled && process.env.OPENAI_API_KEY) {
      this.reviewers.ai = new AIReviewer(config.ai_review, logger);
    }
  }

  /**
   * Review multiple files
   */
  async reviewFiles(files, owner, repo, baseRef, headRef) {
    const results = {
      files: [],
      totalIssues: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      filesReviewed: 0,
      linesAnalyzed: 0,
    };

    for (const file of files) {
      try {
        this.logger.info(`Reviewing file: ${file.filename}`);

        const fileReview = await this.reviewFile(file, owner, repo, baseRef, headRef);

        results.files.push(fileReview);
        results.filesReviewed++;
        results.linesAnalyzed += file.changes || 0;

        // Aggregate issue counts
        fileReview.issues.forEach((issue) => {
          results.totalIssues++;
          switch (issue.severity) {
            case 'critical':
              results.criticalIssues++;
              break;
            case 'high':
              results.highIssues++;
              break;
            case 'medium':
              results.mediumIssues++;
              break;
            case 'low':
              results.lowIssues++;
              break;
          }
        });
      } catch (error) {
        this.logger.error(`Error reviewing file ${file.filename}:`, error);
      }
    }

    return results;
  }

  /**
   * Review a single file
   */
  async reviewFile(file, owner, repo, baseRef, headRef) {
    const fileReview = {
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      issues: [],
    };

    // Skip binary files
    if (this.isBinaryFile(file.filename)) {
      this.logger.info(`Skipping binary file: ${file.filename}`);
      return fileReview;
    }

    // Get file content and diff
    const fileContent = file.patch || '';
    const fileExtension = this.getFileExtension(file.filename);

    // Run enabled reviewers
    const enabledChecks = this.config.review_settings?.enabled_checks || [];

    for (const checkType of enabledChecks) {
      const reviewer = this.reviewers[checkType];
      if (reviewer) {
        try {
          const issues = await reviewer.review(file.filename, fileContent, fileExtension);
          fileReview.issues.push(...issues);
        } catch (error) {
          this.logger.error(`Error in ${checkType} review:`, error);
        }
      }
    }

    // Run AI review if available
    if (this.reviewers.ai && fileContent) {
      try {
        const aiIssues = await this.reviewers.ai.review(file.filename, fileContent, fileExtension);
        fileReview.issues.push(...aiIssues);
      } catch (error) {
        this.logger.error('Error in AI review:', error);
      }
    }

    // Filter issues by minimum severity
    const minSeverity = this.config.review_settings?.min_severity_to_comment || 'low';
    fileReview.issues = this.filterBySeverity(fileReview.issues, minSeverity);

    // Sort issues by severity and line number
    fileReview.issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return (a.line || 0) - (b.line || 0);
    });

    return fileReview;
  }

  /**
   * Check if file is binary
   */
  isBinaryFile(filename) {
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
      '.pdf', '.zip', '.tar', '.gz', '.jar', '.war',
      '.exe', '.dll', '.so', '.dylib',
      '.woff', '.woff2', '.ttf', '.eot',
    ];

    return binaryExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Filter issues by minimum severity
   */
  filterBySeverity(issues, minSeverity) {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const minLevel = severityOrder[minSeverity] || 3;

    return issues.filter((issue) => {
      const issueLevel = severityOrder[issue.severity] || 3;
      return issueLevel <= minLevel;
    });
  }

  /**
   * Get language from file extension
   */
  getLanguage(extension) {
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      java: 'java',
      py: 'python',
      go: 'go',
      rb: 'ruby',
      php: 'php',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      rs: 'rust',
      swift: 'swift',
      kt: 'kotlin',
    };

    return languageMap[extension] || 'unknown';
  }
}

// Made with Bob
