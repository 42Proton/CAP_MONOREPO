import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PostgresChatMessageHistory } from "@langchain/community/stores/message/postgres";
import { env } from '../config/env.js';
import { z } from "zod";
import { Pool } from "pg";
//import { findings } from '@mono/db/src/schema';
import { db, findings } from '@mono/db';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    language: z.string().describe("The detected programming language (e.g., Python, TypeScript)"),
    framework: z.string().describe("The detected framework (e.g., Express, React, Django) or 'None'"),
    healthScore: z.number(),
    riskLevel: z.enum(["critical", "major", "minor", "info"]),
    summaryStats: z.object({
      securityCount: z.number(),
      performanceCount: z.number(),
      memoryCount: z.number(),
      styleCount: z.number(),
      totalIssues: z.number(),
      critical: z.number(),
      major: z.number(), 
      minor: z.number(),
      info: z.number(),
      executiveSummary: z.string().describe("A 2-sentence overview of the code quality")
    }),
    detailedFindings: z.array(z.object({
      filePath: z.string().describe("The name of the file being analyzed"),
      lineStart: z.number().nullable(),
      lineEnd: z.number().nullable(),
      columnStart: z.number().default(1),
      columnEnd: z.number().default(80),
      severity: z.enum(["critical", "major", "minor", "info"]),
      category: z.enum(["security", "performance", "style", "best_practice", "bug", "maintainability"]),
      ruleId: z.string().describe("A unique rule identifier e.g., CAP-SEC-001"),
      title: z.string(),
      description: z.string(),
      suggestion: z.string(),
      codeSnippet: z.string(),
      suggestedFix: z.string(),
      aiConfidence: z.number().min(0).max(1).default(0.95),
      aiModel: z.string().default("gemini-2.5-flash")
    })),
    fixedCode: z.string(),
    suggestions: z.array(z.string())
  })
);

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-flash",
  apiKey: env.OPENAI_API_KEY, 
  maxOutputTokens: 8192,
  temperature: 0.1, 
});

const codeAnalysisPrompt = PromptTemplate.fromTemplate(`
You are the "CAP" (Code Analysis & Protection) Expert.
Your mission is to perform a deep static analysis on the provided code.

DETECTION LAYER TASK:
1. Identify the programming language and framework.
2. If the filePath is "manual_snippet.txt", suggest a more appropriate filename in your mind to guide your analysis.

ANALYSIS GUIDELINES:
- BE PRECISE: Provide exact line numbers (lineStart) for every finding.
- BE ACTIONABLE: The 'suggestedFix' should be ready to copy-paste.
- CATEGORIZE: Every finding must strictly fall into one of the categories: Security, Performance, Memory, Style, or Best Practices.

INSTRUCTIONS:
- The 'analysis' object should be a high-level summary of each category.
- The 'detailedFindings' array must contain every specific bug, leak, or vulnerability as a separate object.
- Classify each finding into: Security, Memory, Performance, or Style.

Session History:
{chat_history}

{format_instructions}

Analyze this file: {filePath}
Content:
{code}
`);

const formatInstructions = parser.getFormatInstructions();

export const analyzeCodeSnippet = async (code: string, sessionId: string, filePath: string = "manual_snippet.txt") => {
  try {
    const chatHistory = new PostgresChatMessageHistory({
      tableName: "code_reviews_history",
      sessionId: sessionId,
      pool: pool,
    });
    
    const previousMessages = await chatHistory.getMessages();
    const massiveHistory = previousMessages.slice(-100); 

    const chatHistoryText = massiveHistory.length > 0 
      ? massiveHistory.map(m => `${m._getType() === 'human' ? 'User' : 'Assistant'}: ${m.content}`).join("\n---\n")
      : "Start of session.";

    const formattedPrompt = await codeAnalysisPrompt.format({
      code: code,
      filePath: filePath,
      format_instructions: formatInstructions,
      chat_history: chatHistoryText || "New analysis session."
    });

    const response = await model.invoke(formattedPrompt);
    let textOutput = response.content as string; 

    if (textOutput.includes("```")) {
      textOutput = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    const analysisResult = await parser.parse(textOutput);

    if (analysisResult.detailedFindings && analysisResult.detailedFindings.length > 0) {
      const findingsToSave = analysisResult.detailedFindings.map(f => ({
        ...f,
        sessionId: sessionId,
        aiGenerated: 1,
      }));

      await db.insert(findings).values(findingsToSave);
    }

    await chatHistory.addUserMessage(`Analyzed file: ${filePath}`);
    await chatHistory.addAIMessage(textOutput);

    return analysisResult;
    
  } catch (error) {
    console.error("CAP Analysis Error:", error);
    throw new Error("Failed to analyze code. Check logs for details.");
  }
};