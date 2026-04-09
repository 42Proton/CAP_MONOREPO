import { Router, Request, Response, NextFunction } from 'express';
import { analyzeCodeSnippet } from '../agents/main-agent.js'; 
import { successResponse, HTTP_STATUS } from '@mono/shared';
import { db,  analysisSessions,  findings} from '@mono/db';
import { eq , and} from 'drizzle-orm';
import { isAuth } from '../middleware/auth.js';

const router: Router = Router();

// router.post('/analyze', isAuth, async (req: Request, res: Response, next: NextFunction) => {
//   let sessionId: string | undefined;
//   try {
//     const { code , projectId} = req.body;

//     if (!code || !projectId) {
//       const error: any = new Error("Missing code or projectId");
//       error.statusCode = HTTP_STATUS.BAD_REQUEST;
//       return next(error); 
//     }
//     const userId = req.user!.userId;

//     const [newSession] = await db.insert(analysisSessions).values({
//       projectId: projectId,
//       triggeredBy: userId,
//       status: 'running',
//       createdAt: new Date(),
//     }).returning();
//     sessionId = newSession.id;
//     const analysis = await analyzeCodeSnippet(code, sessionId);

//     await db.update(analysisSessions)
//       .set({ 
//         status: 'completed', 
//         completedAt: new Date(),
//       })
//       .where(eq(analysisSessions.id, sessionId));


//     res.json(
//       successResponse({
//         sessionId: sessionId,
//         analysis: analysis,
//         timestamp: new Date().toISOString()
//       })
//     );
//   } catch (error) {
//     if (sessionId) {
//        await db.update(analysisSessions)
//          .set({ 
//            status: 'failed', 
//            statusMessage: (error as Error).message 
//          })
//          .where(eq(analysisSessions.id, sessionId));
//     }
//     next(error);
//   }
// });


router.post('/analyze', isAuth, async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  let sessionId: string | undefined;
  try {
    const { code, files, projectId } = req.body;
    const userId = req.user!.userId;

    if (!projectId || (!code && (!files || files.length === 0))) {
      const error: any = new Error("Missing projectId or code content");
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      return next(error);
    }

    const filesToAnalyze: { path: string, content: string }[] = [];

    if (code) {
      filesToAnalyze.push({ path: 'manual_snippet.txt', content: code });
    } else if (files && Array.isArray(files)) {
      filesToAnalyze.push(...files);
    }

    const [newSession] = await db.insert(analysisSessions).values({
      projectId: projectId,
      triggeredBy: userId,
      status: 'running',
      createdAt: new Date(),
    }).returning();
    
    sessionId = newSession.id;
    let totalIssues = 0;
    let critical = 0, major = 0, minor = 0, info = 0;
    let security = 0, performance = 0, memory = 0, style = 0;
    let totalHealthScore = 0;

    const analysisResults = [];
    for (const file of filesToAnalyze) {
      const result = await analyzeCodeSnippet(file.content, sessionId, file.path);
      analysisResults.push({ file: file.path, analysis: result });
    
      const stats = result.summaryStats;
      totalIssues += stats.totalIssues;
      critical += stats.critical;
      major += stats.major;
      minor += stats.minor;
      info += stats.info;
      
      security += stats.securityCount;
      performance += stats.performanceCount;
      memory += stats.memoryCount;
      style += stats.styleCount;
      
      totalHealthScore += result.healthScore;
    }

    const avgHealthScore = Math.round(totalHealthScore / analysisResults.length);
    const totalLines = filesToAnalyze.reduce((sum, file) => {
    return sum + file.content.split('\n').length;
  }, 0);

  const endTime = Date.now(); 
  const durationInMs = endTime - startTime; 

  await db.update(analysisSessions)
      .set({ 
        status: 'completed', 
        completedAt: new Date(),
        summary: {
          totalFindings: totalIssues, 
          bySeverity: {
            critical,
            major,
            minor,
            info,
          },
          byCategory: {
            security,
            performance,
            memory,
            style,
            health_score: avgHealthScore
          },
          filesAnalyzed: analysisResults.length,
          linesAnalyzed: totalLines,
          duration: durationInMs
        }
      })
      .where(eq(analysisSessions.id, sessionId));

    res.json(
      successResponse({
        sessionId: sessionId,
        results: analysisResults,
        timestamp: new Date().toISOString()
      })
    );

  } catch (error) {
    if (sessionId) {
      await db.update(analysisSessions)
         .set({ 
           status: 'failed', 
           statusMessage: (error as Error).message
         })
         .where(eq(analysisSessions.id, sessionId));
    }
    next(error);
  }
});

router.get('/sessions/:sessionId/findings',isAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    const [session] = await db
      .select()
      .from(analysisSessions)
      .where(
        and(
          eq(analysisSessions.id, sessionId),
          eq(analysisSessions.triggeredBy, userId)
        )
      )
      .limit(1);

    if (!session) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        success: false, 
        message: "You do not have permission to view these findings." 
      });
    }

    const sessionFindings = await db
      .select()
      .from(findings)
      .where(eq(findings.sessionId, sessionId))
      .orderBy(findings.filePath, findings.lineStart);

    if (!sessionFindings || sessionFindings.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No findings found for this session."
      });
    }
    res.json({
      success: true,
      data: sessionFindings
    });
  } catch (error) {
    console.error("Fetch Findings Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export { router as aiRouter };