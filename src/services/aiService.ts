import type { Task, Subtask } from "../types/task";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiConfig, validateGeminiConfig } from "../config/gemini";

export interface TaskDivisionSuggestion {
  originalTask: Task;
  suggestedTasks: {
    title: string;
    description: string;
    subtasks: Subtask[];
  }[];
}

export interface DivisionPreview {
  originalTitle: string;
  originalSubtaskCount: number;
  suggestedDivisions: {
    title: string;
    description: string;
    subtaskCount: number;
    subtasks: Subtask[];
  }[];
}

export const aiService = {
  /**
   * Analyzes a task with many subtasks and suggests how to divide it
   */
  async divideTask(task: Task): Promise<TaskDivisionSuggestion> {
    if (!task.subtasks || task.subtasks.length <= 10) {
      throw new Error("Task does not have enough subtasks to divide");
    }

    // Check if Gemini API is available
    if (!validateGeminiConfig()) {
      console.warn("Gemini API not configured, falling back to simulated AI");
      return this.simulateDivision(task);
    }

    try {
      // Use real Gemini AI
      return await this.divideTaskWithGemini(task);
    } catch (error) {
      console.error("Gemini API error, falling back to simulated AI:", error);
      return this.simulateDivision(task);
    }
  },

  /**
   * Uses Gemini AI to analyze and divide tasks
   */
  async divideTaskWithGemini(task: Task): Promise<TaskDivisionSuggestion> {
    const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
    const model = genAI.getGenerativeModel({
      model: geminiConfig.model,
      generationConfig: geminiConfig.generationConfig,
      safetySettings: geminiConfig.safetySettings,
    });

    const prompt = this.createDivisionPrompt(task);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return this.parseGeminiResponse(task, text);
  },

  /**
   * Creates an optimized prompt for Gemini to analyze task division
   */
  createDivisionPrompt(task: Task): string {
    const subtaskList =
      task.subtasks
        ?.map((subtask, index) => `${index + 1}. ${subtask.title}`)
        .join("\n") || "";

    return `You are an expert productivity coach specializing in breaking down complex projects into manageable tasks. Your goal is to help users with ADHD and executive function challenges by creating logical, actionable task divisions.

ORIGINAL TASK:
Title: "${task.title}"
Total Subtasks: ${task.subtasks?.length || 0}

CURRENT SUBTASKS:
${subtaskList}

ANALYSIS INSTRUCTIONS:
1. **Identify Natural Phases**: Look for logical phases or stages in the work (e.g., Planning → Research → Execution → Review)
2. **Group by Context**: Group subtasks that require similar tools, locations, or mental states
3. **Consider Dependencies**: Keep related subtasks together to maintain workflow continuity
4. **Balance Workload**: Aim for 3-6 subtasks per new task (optimal for focus and completion)
5. **Create Clear Boundaries**: Each new task should feel like a complete, achievable unit

DIVISION STRATEGY:
- Create 2-4 new tasks maximum
- Each task should represent a distinct phase or context
- Task titles should be SPECIFIC and descriptive (e.g., "Research & Discovery", "Design & Prototyping", "Testing & Iteration")
- Avoid generic titles like "Phase 1", "Part 1", or "Task A"
- Descriptions should explain the purpose and scope

RESPONSE FORMAT (JSON only):
{
  "suggestedTasks": [
    {
      "title": "Research & Discovery",
      "description": "Gather user insights and analyze existing systems",
      "subtasks": [
        {
          "id": "original_subtask_id",
          "title": "Original subtask title",
          "completed": false,
          "order": 0
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
- Preserve ALL original subtask IDs exactly
- Maintain original completion status
- Create meaningful, SPECIFIC task titles (e.g., "Research & Discovery", "Design & Prototyping", "Testing & Iteration")
- NEVER use generic titles like "Phase 1", "Part 1", "Task A", or "Group 1"
- Focus on logical workflow progression
- Return ONLY valid JSON, no markdown or explanations`;
  },

  /**
   * Parses Gemini's response into our expected format
   */
  parseGeminiResponse(task: Task, response: string): TaskDivisionSuggestion {
    try {
      // Clean the response (remove markdown formatting if present)
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanResponse);

      // Validate the response structure
      if (!parsed.suggestedTasks || !Array.isArray(parsed.suggestedTasks)) {
        throw new Error("Invalid response structure");
      }

      // Map subtasks back to original objects and validate no duplicates
      const seenSubtaskIds = new Set<string>();
      const suggestedTasks = parsed.suggestedTasks.map((suggested: any) => {
        const uniqueSubtasks = suggested.subtasks
          .map((subtask: any) => {
            const originalSubtask = task.subtasks?.find(
              (s) => s.id === subtask.id
            );
            return originalSubtask || subtask;
          })
          .filter((subtask: Subtask) => {
            if (seenSubtaskIds.has(subtask.id)) {
              console.warn(
                `Duplicate subtask in Gemini response: ${subtask.title} (${subtask.id})`
              );
              return false;
            }
            seenSubtaskIds.add(subtask.id);
            return true;
          });

        return {
          title: suggested.title,
          description: suggested.description,
          subtasks: uniqueSubtasks,
        };
      });

      // Final validation: ensure all original subtasks are accounted for
      const allSuggestedSubtaskIds = new Set(
        suggestedTasks.flatMap((task: any) =>
          task.subtasks.map((s: any) => s.id)
        )
      );
      const originalSubtaskIds = new Set(task.subtasks?.map((s) => s.id) || []);

      const missingSubtaskIds = [...originalSubtaskIds].filter(
        (id) => !allSuggestedSubtaskIds.has(id)
      );
      if (missingSubtaskIds.length > 0) {
        console.warn(
          `Some subtasks were not included in the division: ${missingSubtaskIds.join(
            ", "
          )}`
        );
      }

      return {
        originalTask: task,
        suggestedTasks,
      };
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw new Error("Failed to parse AI response");
    }
  },

  /**
   * Fallback simulation when Gemini is not available
   */
  async simulateDivision(task: Task): Promise<TaskDivisionSuggestion> {
    // Simple fallback - just split into 2-3 groups
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const subtasks = task.subtasks || [];
    const groups = this.groupSubtasksByTheme(subtasks);

    const suggestedTasks = groups.map((group) => ({
      title: this.generateMeaningfulTitle(
        task.title,
        group.subtasks,
        group.theme
      ),
      description: `Tasks related to ${group.theme.toLowerCase()}`,
      subtasks: group.subtasks,
    }));

    // Final validation: ensure all original subtasks are accounted for
    const allSuggestedSubtaskIds = new Set(
      suggestedTasks.flatMap((task: any) => task.subtasks.map((s: any) => s.id))
    );
    const originalSubtaskIds = new Set(task.subtasks?.map((s) => s.id) || []);

    const missingSubtaskIds = [...originalSubtaskIds].filter(
      (id) => !allSuggestedSubtaskIds.has(id)
    );
    if (missingSubtaskIds.length > 0) {
      console.warn(
        `Some subtasks were not included in the fallback division: ${missingSubtaskIds.join(
          ", "
        )}`
      );
    }

    return {
      originalTask: task,
      suggestedTasks,
    };
  },

  /**
   * Groups subtasks by analyzing their titles for common themes
   */
  groupSubtasksByTheme(subtasks: Subtask[]) {
    const groups: { theme: string; subtasks: Subtask[] }[] = [];
    const processed = new Set<string>();

    subtasks.forEach((subtask) => {
      if (processed.has(subtask.id)) return;

      const theme = this.extractTheme(subtask.title);

      // Find related subtasks that haven't been processed yet
      const relatedSubtasks = subtasks.filter(
        (other) =>
          !processed.has(other.id) &&
          this.areRelated(subtask.title, other.title, theme)
      );

      // Create group with current subtask and related ones
      const groupSubtasks = [subtask, ...relatedSubtasks];

      // Mark all subtasks in this group as processed
      groupSubtasks.forEach((s) => processed.add(s.id));

      groups.push({
        theme,
        subtasks: groupSubtasks,
      });
    });

    // Ensure no group is too large (max 6 subtasks per group)
    const balancedGroups = this.balanceGroups(groups);

    // Final validation: ensure no subtask appears in multiple groups
    return this.validateNoDuplicates(balancedGroups);
  },

  /**
   * Extracts a theme from a subtask title
   */
  extractTheme(title: string): string {
    const lowerTitle = title.toLowerCase();

    // Common task themes
    const themes = [
      {
        keywords: [
          "research",
          "interview",
          "analyze",
          "audit",
          "personas",
          "journey",
        ],
        theme: "Research",
      },
      {
        keywords: ["wireframe", "mockup", "prototype", "design", "create"],
        theme: "Design",
      },
      {
        keywords: ["test", "testing", "feedback", "refine", "iterate"],
        theme: "Testing",
      },
      {
        keywords: [
          "hand off",
          "developers",
          "implementation",
          "present",
          "client",
        ],
        theme: "Delivery",
      },
      {
        keywords: ["plan", "schedule", "organize", "arrange"],
        theme: "Planning",
      },
      {
        keywords: ["buy", "purchase", "order", "shop", "get"],
        theme: "Procurement",
      },
      {
        keywords: ["call", "email", "contact", "reach out"],
        theme: "Communication",
      },
      {
        keywords: ["write", "draft", "create", "prepare"],
        theme: "Content Creation",
      },
      {
        keywords: ["review", "check", "verify", "validate"],
        theme: "Review",
      },
      {
        keywords: ["setup", "configure", "install", "prepare"],
        theme: "Setup",
      },
    ];

    for (const { keywords, theme } of themes) {
      if (keywords.some((keyword) => lowerTitle.includes(keyword))) {
        return theme;
      }
    }

    return "General";
  },

  /**
   * Checks if two subtask titles are related
   */
  areRelated(title1: string, title2: string, theme: string): boolean {
    const lower1 = title1.toLowerCase();
    const lower2 = title2.toLowerCase();

    // Check for common words (excluding common words)
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ];
    const words1 = lower1
      .split(" ")
      .filter((word) => !commonWords.includes(word));
    const words2 = lower2
      .split(" ")
      .filter((word) => !commonWords.includes(word));

    const commonWordCount = words1.filter((word) =>
      words2.includes(word)
    ).length;
    const similarity = commonWordCount / Math.max(words1.length, words2.length);

    return similarity > 0.3 || this.extractTheme(title2) === theme;
  },

  /**
   * Balances groups to ensure no group is too large
   */
  balanceGroups(groups: { theme: string; subtasks: Subtask[] }[]) {
    const maxSubtasksPerGroup = 6;
    const balancedGroups: { theme: string; subtasks: Subtask[] }[] = [];

    groups.forEach((group) => {
      if (group.subtasks.length <= maxSubtasksPerGroup) {
        balancedGroups.push(group);
      } else {
        // Split large groups into smaller ones
        const chunks = this.chunkArray(group.subtasks, maxSubtasksPerGroup);
        chunks.forEach((chunk, index) => {
          balancedGroups.push({
            theme: `${group.theme} ${index > 0 ? `(Part ${index + 1})` : ""}`,
            subtasks: chunk,
          });
        });
      }
    });

    return balancedGroups;
  },

  /**
   * Splits an array into chunks of specified size
   */
  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Validates that no subtask appears in multiple groups
   */
  validateNoDuplicates(groups: { theme: string; subtasks: Subtask[] }[]) {
    const seenSubtasks = new Set<string>();
    const validatedGroups: { theme: string; subtasks: Subtask[] }[] = [];

    groups.forEach((group) => {
      const uniqueSubtasks = group.subtasks.filter((subtask) => {
        if (seenSubtasks.has(subtask.id)) {
          console.warn(
            `Duplicate subtask found: ${subtask.title} (${subtask.id})`
          );
          return false;
        }
        seenSubtasks.add(subtask.id);
        return true;
      });

      if (uniqueSubtasks.length > 0) {
        validatedGroups.push({
          theme: group.theme,
          subtasks: uniqueSubtasks,
        });
      }
    });

    return validatedGroups;
  },

  /**
   * Generates meaningful task titles based on theme and content
   */
  generateMeaningfulTitle(
    originalTitle: string,
    _subtasks: Subtask[],
    theme: string
  ): string {
    const baseTitle = originalTitle.replace(
      /^(plan|organize|prepare|manage|redesign)\s+/i,
      ""
    );

    // Create specific titles based on theme and subtask content
    const titleVariations = {
      Research: `${baseTitle} - Research & Discovery`,
      Design: `${baseTitle} - Design & Prototyping`,
      Testing: `${baseTitle} - Testing & Iteration`,
      Delivery: `${baseTitle} - Handoff & Delivery`,
      Planning: `${baseTitle} - Planning & Organization`,
      Procurement: `${baseTitle} - Procurement & Purchasing`,
      Communication: `${baseTitle} - Communication & Outreach`,
      "Content Creation": `${baseTitle} - Content & Documentation`,
      Review: `${baseTitle} - Review & Quality Assurance`,
      Setup: `${baseTitle} - Setup & Configuration`,
      General: `${baseTitle} - Implementation`,
    };

    return (
      titleVariations[theme as keyof typeof titleVariations] ||
      `${baseTitle} - ${theme}`
    );
  },

  /**
   * Creates a preview of the division without actually dividing the task
   */
  async previewDivision(task: Task): Promise<DivisionPreview> {
    if (!task.subtasks || task.subtasks.length <= 10) {
      throw new Error("Task does not have enough subtasks to divide");
    }

    const suggestion = await this.divideTask(task);

    return {
      originalTitle: task.title,
      originalSubtaskCount: task.subtasks.length,
      suggestedDivisions: suggestion.suggestedTasks.map((suggestedTask) => ({
        title: suggestedTask.title,
        description: suggestedTask.description,
        subtaskCount: suggestedTask.subtasks.length,
        subtasks: suggestedTask.subtasks,
      })),
    };
  },
};
