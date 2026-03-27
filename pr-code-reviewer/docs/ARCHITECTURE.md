# PR Code Reviewer - Architecture Documentation

## System Overview

The PR Code Reviewer is a modular, extensible system designed to automatically review pull requests and provide intelligent feedback on code quality, security, performance, and maintainability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub / CI/CD Pipeline                  │
│                    (Triggers on PR Events)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Main Entry Point                        │
│                      (src/index.js)                          │
│  • Validates environment                                     │
│  • Initializes services                                      │
│  • Orchestrates review process                              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   GitHub    │  │   Config    │  │   Logger    │
│   Service   │  │   Loader    │  │   Service   │
└─────────────┘  └─────────────┘  └─────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Code Reviewer                            │
│                  (src/reviewers/CodeReviewer.js)            │
│  • Orchestrates specialized reviewers                       │
│  • Filters and aggregates results                           │
│  • Manages review workflow                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         ▼               ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Security   │  │ Performance │  │Maintainabil-│  │    Style    │
│  Reviewer   │  │  Reviewer   │  │ity Reviewer │  │  Reviewer   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
         │               │               │               │
         └───────────────┴───────────────┴───────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │     AI      │
                  │  Reviewer   │
                  │  (Optional) │
                  └─────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Results Aggregation                       │
│  • Combines all review findings                             │
│  • Applies severity filtering                               │
│  • Generates summary statistics                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Integration                         │
│  • Posts inline comments                                    │
│  • Creates review (approve/comment/request changes)         │
│  • Adds labels                                              │
│  • Generates summary                                        │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Main Entry Point (`src/index.js`)

**Responsibilities:**
- Environment validation
- Service initialization
- Workflow orchestration
- Error handling
- Exit code management

**Key Functions:**
- `main()`: Entry point that orchestrates the entire review process
- `validateEnvironment()`: Ensures all required environment variables are set
- `filterFiles()`: Applies exclusion rules to changed files
- `generateSummary()`: Creates human-readable summary of results

### 2. GitHub Service (`src/utils/GitHubService.js`)

**Responsibilities:**
- GitHub API interactions
- PR data retrieval
- Comment posting
- Review creation
- Label management

**Key Methods:**
- `getPullRequest()`: Fetches PR details
- `getChangedFiles()`: Retrieves list of modified files
- `postReview()`: Creates a review with inline comments
- `addLabels()`: Adds labels based on review results
- `formatReviewBody()`: Generates formatted review summary

**API Rate Limiting:**
- Implements retry logic
- Batches comments (max 50 per review)
- Handles rate limit errors gracefully

### 3. Configuration Loader (`src/utils/ConfigLoader.js`)

**Responsibilities:**
- YAML configuration parsing
- Environment variable overrides
- Default configuration fallback
- Configuration validation

**Key Methods:**
- `load()`: Loads and parses configuration
- `mergeWithEnvOverrides()`: Applies environment-based overrides
- `getDefaultConfig()`: Provides fallback configuration
- `validate()`: Ensures configuration is valid

### 4. Logger (`src/utils/Logger.js`)

**Responsibilities:**
- Structured logging
- Multiple output targets (console, file)
- Log level management
- Error tracking

**Features:**
- Winston-based logging
- Timestamp inclusion
- JSON formatting for parsing
- Separate error log file

## Reviewer Components

### Base Reviewer Pattern

All reviewers follow a common interface:

```javascript
class Reviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  async review(filename, content, extension) {
    // Returns array of issues
    return [];
  }
}
```

### 1. Security Reviewer (`src/reviewers/SecurityReviewer.js`)

**Detection Capabilities:**
- Hardcoded credentials (passwords, API keys, tokens)
- SQL injection vulnerabilities
- XSS vulnerabilities
- Insecure dependencies
- Sensitive data exposure

**Pattern Matching:**
- Regex-based detection
- Context-aware analysis
- Configurable patterns

**Issue Structure:**
```javascript
{
  type: 'hardcoded_credentials',
  severity: 'critical',
  title: 'Hardcoded API key detected',
  message: 'Detailed explanation',
  line: 15,
  suggestion: 'How to fix',
  code: 'Problematic code snippet'
}
```

### 2. Performance Reviewer (`src/reviewers/PerformanceReviewer.js`)

**Analysis Areas:**
- Loop efficiency
- Memory leak detection
- Blocking operations
- Unnecessary computations

**Techniques:**
- Static code analysis
- Pattern recognition
- Threshold-based detection
- Context analysis

### 3. Maintainability Reviewer (`src/reviewers/MaintainabilityReviewer.js`)

**Code Quality Checks:**
- Function length
- Cyclomatic complexity
- Code duplication
- Naming conventions
- Error handling

**Metrics:**
- Lines of code per function
- Nesting depth
- Parameter count
- Variable name length

### 4. Style Reviewer (`src/reviewers/StyleReviewer.js`)

**Style Enforcement:**
- Indentation consistency
- Naming conventions
- Import organization
- Comment quality

**Language-Specific Rules:**
- JavaScript: camelCase, 2-space indent
- Java: camelCase, 4-space indent
- Python: snake_case, 4-space indent

### 5. AI Reviewer (`src/reviewers/AIReviewer.js`)

**AI Integration:**
- OpenAI GPT-4 integration
- Context-aware suggestions
- Natural language feedback
- Intelligent pattern recognition

**Features:**
- Configurable prompts
- Token management
- Rate limiting
- Fallback handling

**Response Parsing:**
- JSON format support
- Markdown format support
- Severity normalization
- Error recovery

## Data Flow

### 1. Initialization Phase

```
Environment Variables → Config Loader → Configuration Object
                                      ↓
GitHub Token → Octokit Client → GitHub Service
                                      ↓
                              Logger Initialization
```

### 2. PR Analysis Phase

```
PR Number → GitHub Service → PR Details
                          → Changed Files
                          ↓
File Filtering → Excluded Files Removed
                          ↓
                    Reviewable Files
```

### 3. Review Phase

```
For each file:
  File Content → Security Reviewer → Issues[]
              → Performance Reviewer → Issues[]
              → Maintainability Reviewer → Issues[]
              → Style Reviewer → Issues[]
              → AI Reviewer (optional) → Issues[]
                          ↓
              Aggregate All Issues
                          ↓
              Apply Severity Filter
                          ↓
              Sort by Severity & Line
```

### 4. Reporting Phase

```
Review Results → Format Review Body
              → Create Inline Comments
              → Post to GitHub
              → Add Labels
              → Generate Summary
```

## Configuration System

### Configuration Hierarchy

1. **Default Configuration** (hardcoded fallback)
2. **YAML Configuration** (`src/config/review-config.yml`)
3. **Environment Variables** (highest priority)

### Configuration Sections

```yaml
review_settings:      # Global review behavior
security:            # Security check configuration
performance:         # Performance thresholds
maintainability:     # Code quality standards
style:              # Style conventions
ai_review:          # AI integration settings
exclusions:         # File/path exclusions
github:             # GitHub integration settings
```

## Extension Points

### Adding New Reviewers

1. Create new reviewer class in `src/reviewers/`
2. Implement the standard interface
3. Register in `CodeReviewer.js`
4. Add configuration section in `review-config.yml`

Example:
```javascript
// src/reviewers/CustomReviewer.js
export class CustomReviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  async review(filename, content, extension) {
    const issues = [];
    // Your custom logic
    return issues;
  }
}

// Register in CodeReviewer.js
import { CustomReviewer } from './CustomReviewer.js';

this.reviewers.custom = new CustomReviewer(config.custom, logger);
```

### Adding New Check Types

1. Add check to appropriate reviewer
2. Update configuration schema
3. Add documentation
4. Add tests

### Custom Patterns

Add custom detection patterns in configuration:

```yaml
security:
  patterns:
    custom_pattern:
      - 'your_regex_pattern_here'
```

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing**: Reviews run concurrently where possible
2. **File Filtering**: Early exclusion of non-reviewable files
3. **Content Truncation**: Large files are truncated for AI review
4. **Comment Batching**: GitHub API calls are batched
5. **Caching**: Configuration is loaded once and reused

### Resource Limits

- **Max Files**: 100 files per review (configurable)
- **Max Comments**: 50 per GitHub review (API limit)
- **AI Tokens**: 4000 tokens per request (configurable)
- **Timeout**: 30 seconds per AI request

## Security Considerations

### Sensitive Data Handling

- Tokens stored in environment variables
- No credentials in logs
- Secure API communication (HTTPS)
- Rate limiting to prevent abuse

### Access Control

- Minimum required GitHub permissions
- Token scope validation
- Repository-level access control

## Error Handling

### Error Categories

1. **Configuration Errors**: Invalid config, missing files
2. **Authentication Errors**: Invalid tokens, expired credentials
3. **API Errors**: Rate limits, network issues
4. **Review Errors**: Parsing failures, timeout

### Recovery Strategies

- Graceful degradation (disable failing reviewers)
- Retry logic for transient failures
- Fallback to basic comments if review fails
- Comprehensive error logging

## Testing Strategy

### Unit Tests

- Individual reviewer logic
- Configuration parsing
- Utility functions

### Integration Tests

- GitHub API interactions
- End-to-end review flow
- Configuration loading

### Test Coverage Goals

- Core logic: >80%
- Reviewers: >70%
- Utilities: >90%

## Monitoring and Observability

### Logging Levels

- **ERROR**: Critical failures
- **WARN**: Recoverable issues
- **INFO**: Normal operations
- **DEBUG**: Detailed diagnostics

### Metrics to Track

- Review duration
- Issues found per category
- API call count
- Error rate
- False positive rate

## Future Enhancements

### Planned Features

1. **Machine Learning**: Train custom models on codebase
2. **Historical Analysis**: Track issue trends over time
3. **Team Metrics**: Developer-specific insights
4. **Custom Rules Engine**: User-defined review rules
5. **Multi-Repository Support**: Cross-repo analysis
6. **Real-time Feedback**: IDE integration

### Scalability Improvements

1. **Distributed Processing**: Multiple review workers
2. **Caching Layer**: Redis for configuration/results
3. **Queue System**: Async review processing
4. **Database Integration**: Persistent storage of results

---

For implementation details, see the source code and inline documentation.