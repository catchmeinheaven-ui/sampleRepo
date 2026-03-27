import OpenAI from 'openai';

/**
 * AI-powered code reviewer using OpenAI GPT models
 * Provides intelligent, context-aware code review suggestions
 */
export class AIReviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Review file using AI
   */
  async review(filename, content, extension) {
    const issues = [];

    if (!this.config.enabled || !process.env.OPENAI_API_KEY) {
      return issues;
    }

    try {
      this.logger.info(`Running AI review for ${filename}`);

      // Prepare the prompt
      const prompt = this.buildPrompt(filename, content, extension);

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.config.prompts?.system || this.getDefaultSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.config.max_tokens || 4000,
        temperature: this.config.temperature || 0.3,
      });

      // Parse the response
      const aiResponse = response.choices[0]?.message?.content;
      this.logger.info(`AI raw response for ${filename}: ${aiResponse}`);
      
      if (aiResponse) {
        const parsedIssues = this.parseAIResponse(aiResponse, filename);
        issues.push(...parsedIssues);
      }

      this.logger.info(`AI review completed for ${filename}. Found ${issues.length} issues.`);
    } catch (error) {
      this.logger.error(`Error in AI review for ${filename}:`, error);
      // Don't throw - allow other reviewers to continue
    }

    return issues;
  }

  /**
   * Build prompt for AI review
   */
  buildPrompt(filename, content, extension) {
    const template = this.config.prompts?.review_template || this.getDefaultReviewTemplate();

    // Truncate content if too long
    const maxContentLength = 8000;
    const truncatedContent = content.length > maxContentLength
      ? content.substring(0, maxContentLength) + '\n... (truncated)'
      : content;

    this.logger.info(`Diff content being sent to AI for ${filename}:\n${truncatedContent}`);

    return template
      .replace('{file_path}', filename)
      .replace('{diff}', truncatedContent)
      .replace('{extension}', extension);
  }

  /**
   * Parse AI response into structured issues
   */
  parseAIResponse(response, filename) {
    const issues = [];

    try {
      // Try to parse as JSON first
      if (response.trim().startsWith('{') || response.trim().startsWith('[')) {
        const parsed = JSON.parse(response);
        const issueArray = Array.isArray(parsed) ? parsed : [parsed];

        issueArray.forEach((issue) => {
          if (issue.type && issue.severity && issue.message) {
            issues.push({
              type: issue.type || 'ai_suggestion',
              severity: this.normalizeSeverity(issue.severity),
              title: issue.title || 'AI Review Suggestion',
              message: issue.message,
              line: issue.line || 1,
              suggestion: issue.suggestion || '',
              code: issue.code || '',
            });
          }
        });
      } else {
        // Parse markdown-style response
        const sections = response.split(/#{1,3}\s+/);

        sections.forEach((section) => {
          const lines = section.trim().split('\n');
          if (lines.length === 0) return;

          const title = lines[0].trim();
          const content = lines.slice(1).join('\n').trim();

          // Extract severity
          const severityMatch = content.match(/severity[:\s]+(\w+)/i);
          const severity = severityMatch ? this.normalizeSeverity(severityMatch[1]) : 'medium';

          // Extract line number
          const lineMatch = content.match(/line[:\s]+(\d+)/i);
          const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;

          // Extract suggestion
          const suggestionMatch = content.match(/suggestion[:\s]+(.*?)(?:\n|$)/is);
          const suggestion = suggestionMatch ? suggestionMatch[1].trim() : '';

          if (title && content) {
            issues.push({
              type: 'ai_suggestion',
              severity,
              title,
              message: content,
              line,
              suggestion,
            });
          }
        });
      }
    } catch (error) {
      this.logger.error('Error parsing AI response:', error);

      // Fallback: create a single issue with the entire response
      issues.push({
        type: 'ai_suggestion',
        severity: 'medium',
        title: 'AI Review Feedback',
        message: response,
        line: 1,
        suggestion: '',
      });
    }

    return issues;
  }

  /**
   * Normalize severity levels
   */
  normalizeSeverity(severity) {
    const normalized = severity.toLowerCase();
    const validSeverities = ['critical', 'high', 'medium', 'low'];

    if (validSeverities.includes(normalized)) {
      return normalized;
    }

    // Map common variations
    const severityMap = {
      error: 'high',
      warning: 'medium',
      info: 'low',
      minor: 'low',
      major: 'high',
      blocker: 'critical',
    };

    return severityMap[normalized] || 'medium';
  }

  /**
   * Get default system prompt
   */
  getDefaultSystemPrompt() {
    return `You are an expert code reviewer with deep knowledge of software engineering best practices, 
security vulnerabilities, and performance optimization. Review the code changes and provide 
constructive feedback focusing on:

1. Security vulnerabilities and potential risks
2. Performance issues and optimization opportunities
3. Code maintainability and readability
4. Best practices violations
5. Potential bugs and edge cases
6. Design patterns and architecture

Provide specific, actionable feedback with clear explanations and suggestions for improvement.
Format your response as JSON array with objects containing: type, severity, title, message, line, suggestion.`;
  }

  /**
   * Get default review template
   */
  getDefaultReviewTemplate() {
    return `Review the following code changes and provide detailed feedback:

File: {file_path}
Extension: {extension}

Code Changes:
\`\`\`
{diff}
\`\`\`

Provide your review as a JSON array of issues, where each issue has:
- type: string (e.g., "security", "performance", "maintainability", "bug")
- severity: string ("critical", "high", "medium", "low")
- title: string (brief description)
- message: string (detailed explanation)
- line: number (line number if applicable)
- suggestion: string (how to fix the issue)
- code: string (optional code example)

Focus on the most important issues and provide actionable suggestions.`;
  }

  /**
   * Review multiple files in batch (for efficiency)
   */
  async reviewBatch(files) {
    const batchSize = 3;
    const results = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map((file) =>
        this.review(file.filename, file.content, file.extension)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay to avoid rate limiting
      if (i + batchSize < files.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Made with Bob
