#!/usr/bin/env npx tsx
/**
 * Batch Question Generator CLI
 *
 * Generates questions for all annotated instances in a project.
 * Reuses the same question generation logic as the web UI.
 *
 * Usage:
 *   npx tsx scripts/batch-generate-questions.mts <project-folder>
 *   npx tsx scripts/batch-generate-questions.mts data/project-batch1
 *   npx tsx scripts/batch-generate-questions.mts data/project-batch1 --instance i-017
 *   npx tsx scripts/batch-generate-questions.mts data/project-batch1 --dry-run
 *   npx tsx scripts/batch-generate-questions.mts data/project-batch1 --use-autosave
 */

import { readFile, writeFile, readdir, mkdir, access } from 'fs/promises';
import { join, basename } from 'path';
import {
  generateQuestions,
  getQuestionStats,
  type GeneratedQuestion,
  type QuestionStats,
  type ExportedQuestions,
} from '../app/utils/questionGenerator/index.js';
import type {
  InstanceAnnotation,
  ProjectFile,
  LabelEntry,
  SceneDistractor,
  CausalRelation,
  CustomQuestion,
} from '../app/types.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

interface CLIOptions {
  projectFolder: string;
  instanceId?: string;
  dryRun: boolean;
  useAutosave: boolean;
  verbose: boolean;
}

interface AutosaveQuestionData {
  instanceId: string;
  instanceName: string;
  lastSaved: string;
  questions: GeneratedQuestion[];
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}Batch Question Generator${colors.reset}

Generates questions for all annotated instances in a project folder.

${colors.cyan}Usage:${colors.reset}
  npx tsx scripts/batch-generate-questions.mts <project-folder> [options]

${colors.cyan}Arguments:${colors.reset}
  project-folder    Path to project folder (e.g., data/project-batch1)

${colors.cyan}Options:${colors.reset}
  --instance <id>   Generate only for specific instance ID
  --dry-run         Preview what would be generated without saving
  --use-autosave    Use autosaved questions if available instead of regenerating
  --verbose         Show detailed output
  --help, -h        Show this help message

${colors.cyan}Examples:${colors.reset}
  npx tsx scripts/batch-generate-questions.mts data/project-batch1
  npx tsx scripts/batch-generate-questions.mts data/project-batch1 --instance i-017
  npx tsx scripts/batch-generate-questions.mts data/project-batch1 --dry-run
  npx tsx scripts/batch-generate-questions.mts data/project-batch1 --use-autosave
`);
    process.exit(0);
  }

  const options: CLIOptions = {
    projectFolder: args[0],
    dryRun: args.includes('--dry-run'),
    useAutosave: args.includes('--use-autosave'),
    verbose: args.includes('--verbose'),
  };

  const instanceIdx = args.indexOf('--instance');
  if (instanceIdx !== -1 && args[instanceIdx + 1]) {
    options.instanceId = args[instanceIdx + 1];
  }

  return options;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadProjectFile(projectFolder: string): Promise<ProjectFile | null> {
  // Try to find the project JSON file
  const files = await readdir(projectFolder);
  const projectFile = files.find(
    (f) => f.endsWith('.json') && !f.startsWith('.')
  );

  if (!projectFile) {
    // If no project file, create a minimal one from annotation files
    return null;
  }

  const content = await readFile(join(projectFolder, projectFile), 'utf-8');
  return JSON.parse(content);
}

async function loadAnnotation(
  projectFolder: string,
  instanceId: string
): Promise<InstanceAnnotation | null> {
  const annotationPath = join(projectFolder, 'annotation', `${instanceId}.json`);

  if (!(await fileExists(annotationPath))) {
    return null;
  }

  const content = await readFile(annotationPath, 'utf-8');
  return JSON.parse(content);
}

async function loadAutosaveQuestions(
  projectFolder: string,
  instanceId: string
): Promise<AutosaveQuestionData | null> {
  const autosavePath = join(projectFolder, 'autosave_question', `${instanceId}.json`);

  if (!(await fileExists(autosavePath))) {
    return null;
  }

  const content = await readFile(autosavePath, 'utf-8');
  return JSON.parse(content);
}

async function getAnnotatedInstanceIds(projectFolder: string): Promise<string[]> {
  const annotationDir = join(projectFolder, 'annotation');

  if (!(await fileExists(annotationDir))) {
    return [];
  }

  const files = await readdir(annotationDir);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => basename(f, '.json'));
}

function generateQuestionsForAnnotation(
  annotation: InstanceAnnotation
): { questions: GeneratedQuestion[]; stats: QuestionStats } {
  const labels: LabelEntry[] = annotation.labels || [];
  const sceneDistractors: SceneDistractor[] = annotation.sceneDistractors || [];
  const causalRelations: CausalRelation[] = annotation.causalRelations || [];
  const customQuestions: CustomQuestion[] = annotation.customQuestions || [];
  const videoCount = annotation.videoPaths?.length || 1;
  const videoDuration = annotation.videoDuration || 60;

  const questions = generateQuestions(
    labels,
    sceneDistractors,
    videoCount,
    videoDuration,
    causalRelations,
    customQuestions
  );

  const stats = getQuestionStats(questions);

  return { questions, stats };
}

async function saveQuestions(
  projectFolder: string,
  instanceId: string,
  instanceName: string,
  questions: GeneratedQuestion[],
  stats: QuestionStats
): Promise<string> {
  const questionsDir = join(projectFolder, 'questions');
  await mkdir(questionsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${instanceId}-${timestamp}.json`;
  const filePath = join(questionsDir, filename);

  const exportData: ExportedQuestions = {
    instanceId,
    instanceName,
    generatedAt: new Date().toISOString(),
    stats,
    questions,
  };

  await writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');

  return filePath;
}

function printStats(stats: QuestionStats, verbose: boolean = false): void {
  console.log(
    `    ${colors.dim}Total: ${colors.reset}${colors.bright}${stats.total}${colors.reset} questions`
  );
  console.log(
    `    ${colors.dim}By Level:${colors.reset} L1: ${stats.byLevel[1]}, L2: ${stats.byLevel[2]}, L3: ${stats.byLevel[3]}`
  );

  if (verbose) {
    console.log(`    ${colors.dim}By Code:${colors.reset}`);
    const sortedCodes = Object.entries(stats.byCode).sort((a, b) => b[1] - a[1]);
    for (const [code, count] of sortedCodes) {
      console.log(`      ${code}: ${count}`);
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log(`\n${colors.bright}${colors.cyan}Batch Question Generator${colors.reset}\n`);
  console.log(`${colors.dim}Project:${colors.reset} ${options.projectFolder}`);

  // Validate project folder exists
  if (!(await fileExists(options.projectFolder))) {
    console.error(`${colors.red}Error: Project folder not found: ${options.projectFolder}${colors.reset}`);
    process.exit(1);
  }

  // Load project file (optional, for instance names)
  const projectFile = await loadProjectFile(options.projectFolder);

  // Get list of annotated instances
  let instanceIds = await getAnnotatedInstanceIds(options.projectFolder);

  if (instanceIds.length === 0) {
    console.error(`${colors.red}Error: No annotations found in ${options.projectFolder}/annotation/${colors.reset}`);
    process.exit(1);
  }

  // Filter to specific instance if requested
  if (options.instanceId) {
    if (!instanceIds.includes(options.instanceId)) {
      console.error(
        `${colors.red}Error: Instance ${options.instanceId} not found in annotations${colors.reset}`
      );
      console.log(`${colors.dim}Available instances: ${instanceIds.join(', ')}${colors.reset}`);
      process.exit(1);
    }
    instanceIds = [options.instanceId];
  }

  console.log(`${colors.dim}Instances to process:${colors.reset} ${instanceIds.length}`);

  if (options.dryRun) {
    console.log(`${colors.yellow}[DRY RUN] No files will be saved${colors.reset}`);
  }

  if (options.useAutosave) {
    console.log(`${colors.blue}[USE AUTOSAVE] Will use autosaved questions if available${colors.reset}`);
  }

  console.log('');

  // Process each instance
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const results: { instanceId: string; questionCount: number; filePath?: string }[] = [];

  for (const instanceId of instanceIds) {
    process.stdout.write(`${colors.cyan}Processing ${instanceId}...${colors.reset} `);

    try {
      // Check for autosave first if requested
      if (options.useAutosave) {
        const autosave = await loadAutosaveQuestions(options.projectFolder, instanceId);
        if (autosave && autosave.questions.length > 0) {
          const stats = getQuestionStats(autosave.questions);

          if (options.dryRun) {
            console.log(`${colors.green}[AUTOSAVE] Would save ${autosave.questions.length} questions${colors.reset}`);
            printStats(stats, options.verbose);
          } else {
            const filePath = await saveQuestions(
              options.projectFolder,
              instanceId,
              autosave.instanceName,
              autosave.questions,
              stats
            );
            console.log(`${colors.green}[AUTOSAVE] Saved ${autosave.questions.length} questions${colors.reset}`);
            printStats(stats, options.verbose);
            results.push({ instanceId, questionCount: autosave.questions.length, filePath });
          }

          successCount++;
          continue;
        }
      }

      // Load annotation
      const annotation = await loadAnnotation(options.projectFolder, instanceId);

      if (!annotation) {
        console.log(`${colors.yellow}[SKIP] No annotation found${colors.reset}`);
        skipCount++;
        continue;
      }

      // Get instance name from project file or annotation
      const instanceName =
        projectFile?.instances.find((i) => i.id === instanceId)?.name ||
        annotation.instanceName ||
        instanceId;

      // Generate questions
      const { questions, stats } = generateQuestionsForAnnotation(annotation);

      if (questions.length === 0) {
        console.log(`${colors.yellow}[SKIP] No questions generated (empty labels?)${colors.reset}`);
        skipCount++;
        continue;
      }

      if (options.dryRun) {
        console.log(`${colors.green}Would generate ${questions.length} questions${colors.reset}`);
        printStats(stats, options.verbose);
      } else {
        const filePath = await saveQuestions(
          options.projectFolder,
          instanceId,
          instanceName,
          questions,
          stats
        );
        console.log(`${colors.green}Generated ${questions.length} questions${colors.reset}`);
        printStats(stats, options.verbose);
        results.push({ instanceId, questionCount: questions.length, filePath });
      }

      successCount++;
    } catch (error) {
      console.log(`${colors.red}[ERROR] ${error instanceof Error ? error.message : error}${colors.reset}`);
      errorCount++;
    }
  }

  // Summary
  console.log(`\n${colors.bright}Summary${colors.reset}`);
  console.log(`${colors.dim}─────────────────────────────${colors.reset}`);
  console.log(`${colors.green}Success:${colors.reset} ${successCount}`);
  console.log(`${colors.yellow}Skipped:${colors.reset} ${skipCount}`);
  console.log(`${colors.red}Errors:${colors.reset} ${errorCount}`);

  if (!options.dryRun && results.length > 0) {
    const totalQuestions = results.reduce((sum, r) => sum + r.questionCount, 0);
    console.log(`\n${colors.bright}Total questions generated:${colors.reset} ${totalQuestions}`);
    console.log(`${colors.dim}Output directory: ${options.projectFolder}/questions/${colors.reset}`);
  }

  // Exit with error code if there were errors
  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});


