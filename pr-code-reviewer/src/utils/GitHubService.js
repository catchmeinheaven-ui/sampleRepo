/**
 * GitHub API service for interacting with pull requests
 */
export class GitHubService {
  constructor(octokit, logger) {
    this.octokit = octokit;
    this.logger = logger;
  }

  /**
   * Get pull request details
   */
  async getPullRequest(owner, repo, prNumber) {
    try {
      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });
      return data;
    } catch (error) {
      this.logger.error('Error fetching PR details:', error);
      throw error;
    }
  }

  /**
   * Get changed files in a pull request
   */
  async getChangedFiles(owner, repo, prNumber) {
    try {
      const { data } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
      });
      return data;
    } catch (error) {
      this.logger.error('Error fetching changed files:', error);
      throw error;
    }
  }

  /**
   * Post a review comment on the PR
   */
  async postComment(owner, repo, prNumber, body) {
    try {
      await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      });
      this.logger.info('Posted comment to PR');
    } catch (error) {
      this.logger.error('Error posting comment:', error);
      throw error;
    }
  }

  /**
   * Post a review with comments
   */
  async postReview(owner, repo, prNumber, reviewResults, commitSha) {
    try {
      // Generate review body
      const reviewBody = this.formatReviewBody(reviewResults);

      // Determine review event
      let event = 'COMMENT';
      if (reviewResults.criticalIssues > 0) {
        event = 'REQUEST_CHANGES';
      } else if (reviewResults.totalIssues === 0) {
        event = 'APPROVE';
      }

      // Post review without inline comments to avoid line number issues
      // Just post the summary
      await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        commit_id: commitSha,
        body: reviewBody,
        event,
      });

      this.logger.info(`Posted review with ${comments.length} comments`);
    } catch (error) {
      this.logger.error('Error posting review:', error);
      // Fallback to posting a simple comment
      try {
        const reviewBody = this.formatReviewBody(reviewResults);
        await this.postComment(owner, repo, prNumber, reviewBody);
      } catch (fallbackError) {
        this.logger.error('Error posting fallback comment:', fallbackError);
      }
    }
  }

  /**
   * Format review body
   */
  formatReviewBody(results) {
    const { totalIssues, criticalIssues, highIssues, mediumIssues, lowIssues } = results;

    let body = '## 🤖 Automated Code Review\n\n';

    if (totalIssues === 0) {
      body += '✅ **No issues found!** The code looks good.\n\n';
      body += `**Files Reviewed:** ${results.filesReviewed}\n`;
      body += `**Lines Analyzed:** ${results.linesAnalyzed}\n`;
      return body;
    }

    body += `### Summary\n\n`;
    body += `**Total Issues:** ${totalIssues}\n\n`;
    body += `| Severity | Count |\n`;
    body += `|----------|-------|\n`;
    body += `| 🔴 Critical | ${criticalIssues} |\n`;
    body += `| 🟠 High | ${highIssues} |\n`;
    body += `| 🟡 Medium | ${mediumIssues} |\n`;
    body += `| 🟢 Low | ${lowIssues} |\n\n`;

    // Add critical issues summary
    if (criticalIssues > 0) {
      body += '### 🔴 Critical Issues\n\n';
      body += 'The following critical issues require immediate attention:\n\n';

      results.files.forEach((file) => {
        const critical = file.issues.filter((i) => i.severity === 'critical');
        if (critical.length > 0) {
          body += `**${file.filename}**\n`;
          critical.forEach((issue) => {
            body += `- Line ${issue.line}: ${issue.title}\n`;
          });
          body += '\n';
        }
      });
    }

    body += `\n**Files Reviewed:** ${results.filesReviewed}\n`;
    body += `**Lines Analyzed:** ${results.linesAnalyzed}\n\n`;
    body += '---\n';
    body += '*This review was automatically generated. Please review the suggestions and make necessary changes.*\n';

    return body;
  }

  /**
   * Create inline comments for issues
   */
  createInlineComments(results) {
    const comments = [];

    results.files.forEach((file) => {
      file.issues.forEach((issue) => {
        const severityEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢',
        };

        let body = `${severityEmoji[issue.severity]} **${issue.title}**\n\n`;
        body += `${issue.message}\n\n`;

        if (issue.suggestion) {
          body += `**Suggestion:**\n${issue.suggestion}\n\n`;
        }

        if (issue.code) {
          body += `**Code:**\n\`\`\`\n${issue.code}\n\`\`\`\n`;
        }

        comments.push({
          path: file.filename,
          line: issue.line || 1,
          body,
        });
      });
    });

    return comments;
  }

  /**
   * Add labels to PR based on review results
   */
  async addLabels(owner, repo, prNumber, results) {
    try {
      const labels = [];

      if (results.criticalIssues > 0) {
        labels.push('security-review-needed');
        labels.push('changes-requested');
      } else if (results.highIssues > 0) {
        labels.push('needs-review');
      } else if (results.totalIssues === 0) {
        labels.push('code-review-approved');
      }

      // Add category-specific labels
      const hasSecurityIssues = results.files.some((f) =>
        f.issues.some((i) => i.type.includes('security') || i.type.includes('credential'))
      );
      if (hasSecurityIssues) {
        labels.push('security');
      }

      const hasPerformanceIssues = results.files.some((f) =>
        f.issues.some((i) => i.type.includes('performance') || i.type.includes('inefficient'))
      );
      if (hasPerformanceIssues) {
        labels.push('performance');
      }

      if (labels.length > 0) {
        await this.octokit.issues.addLabels({
          owner,
          repo,
          issue_number: prNumber,
          labels,
        });
        this.logger.info(`Added labels: ${labels.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('Error adding labels:', error);
      // Don't throw - labels are not critical
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(owner, repo, path, ref) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (data.type === 'file' && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error) {
      this.logger.error(`Error fetching file content for ${path}:`, error);
      return null;
    }
  }

  /**
   * Get diff between two commits
   */
  async getDiff(owner, repo, base, head) {
    try {
      const { data } = await this.octokit.repos.compareCommits({
        owner,
        repo,
        base,
        head,
      });
      return data;
    } catch (error) {
      this.logger.error('Error fetching diff:', error);
      throw error;
    }
  }
}

// Made with Bob
