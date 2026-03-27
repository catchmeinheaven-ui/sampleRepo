#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import { CodeReviewer } from './reviewers/CodeReviewer.js';
import { GitHubService } from './utils/GitHubService.js';
import { Logger } from './utils/Logger.js';
import { ConfigLoader } from './utils/ConfigLoader.js';

dotenv.config();

const logger = new Logger();

/**
 * Main entry point for the PR code reviewer
 */
async function main() {
  try {
    logger.info('Starting PR Code Review Process...');

    // Validate environment variables
    validateEnvironment();

    // Initialize services
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const config = await ConfigLoader.load();
    const githubService = new GitHubService(octokit, logger);
    const codeReviewer = new CodeReviewer(config, logger, githubService);

    // Get PR details from environment
    const prNumber = parseInt(process.env.PR_NUMBER, 10);
    const owner = process.env.REPO_OWNER;
    const repo = process.env.REPO_NAME;
    const baseRef = process.env.BASE_REF;
    const headRef = process.env.HEAD_REF;

    logger.info(`Reviewing PR #${prNumber} in ${owner}/${repo}`);
    logger.info(`Base: ${baseRef}, Head: ${headRef}`);

    // Fetch PR details
    const prDetails = await githubService.getPullRequest(owner, repo, prNumber);
    logger.info(`PR Title: ${prDetails.title}`);
    logger.info(`PR Author: ${prDetails.user.login}`);

    // Get changed files
    const changedFiles = await githubService.getChangedFiles(owner, repo, prNumber);
    logger.info(`Found ${changedFiles.length} changed files`);

    // Filter files based on exclusions
    const filesToReview = filterFiles(changedFiles, config);
    logger.info(`Reviewing ${filesToReview.length} files after applying filters`);

    if (filesToReview.length === 0) {
      logger.info('No files to review after applying filters');
      await githubService.postComment(
        owner,
        repo,
        prNumber,
        '✅ No files require review based on current configuration.'
      );
      return;
    }

    // Perform code review
    const reviewResults = await codeReviewer.reviewFiles(
      filesToReview,
      owner,
      repo,
      baseRef,
      headRef
    );

    logger.info(`Review completed. Found ${reviewResults.totalIssues} issues`);

    // Post review results to GitHub
    await githubService.postReview(
      owner,
      repo,
      prNumber,
      reviewResults,
      prDetails.head.sha
    );

    // Add labels based on review results
    if (config.github.add_labels) {
      await githubService.addLabels(owner, repo, prNumber, reviewResults);
    }

    // Generate summary
    const summary = generateSummary(reviewResults);
    logger.info('Review Summary:');
    logger.info(summary);

    // Exit with appropriate code
    if (reviewResults.criticalIssues > 0) {
      logger.error('Critical issues found. Review requires attention.');
      process.exit(1);
    } else {
      logger.info('Review completed successfully');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during code review:', error);
    process.exit(1);
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = [
    'GITHUB_TOKEN',
    'PR_NUMBER',
    'REPO_OWNER',
    'REPO_NAME',
    'BASE_REF',
    'HEAD_REF',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn if OpenAI API key is missing (AI review will be disabled)
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not set. AI-powered review will be disabled.');
  }
}

/**
 * Filter files based on exclusion patterns
 */
function filterFiles(files, config) {
  const exclusions = config.exclusions || { paths: [], file_patterns: [] };

  return files.filter((file) => {
    // Check path exclusions
    const isExcludedPath = exclusions.paths.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(file.filename);
    });

    if (isExcludedPath) {
      return false;
    }

    // Check file pattern exclusions
    const isExcludedPattern = exclusions.file_patterns.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\./g, '\\.'));
      return regex.test(file.filename);
    });

    return !isExcludedPattern;
  });
}

/**
 * Generate review summary
 */
function generateSummary(results) {
  const lines = [
    '═══════════════════════════════════════',
    '         CODE REVIEW SUMMARY',
    '═══════════════════════════════════════',
    `Total Issues: ${results.totalIssues}`,
    `  Critical: ${results.criticalIssues}`,
    `  High: ${results.highIssues}`,
    `  Medium: ${results.mediumIssues}`,
    `  Low: ${results.lowIssues}`,
    '',
    `Files Reviewed: ${results.filesReviewed}`,
    `Lines Analyzed: ${results.linesAnalyzed}`,
    '═══════════════════════════════════════',
  ];

  return lines.join('\n');
}

// Run the main function
main();

// Made with Bob
