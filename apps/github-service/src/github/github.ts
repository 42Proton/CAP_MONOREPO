import { Request, Response, NextFunction } from 'express';
import { db, eq, users } from '@mono/db';
import { createUserOctokit } from '@mono/github';
import { successResponse, HTTP_STATUS } from '@mono/shared';
import { projects, NewProject } from '@mono/db';
import { ingestAndUploadToMinio } from '../services/ingestion.service';

const fetchUserReposFromGitHub = async (userId: string, repoFullName?: string): Promise<any[]> => {
  const [user] = await db
    .select({ githubAccessToken: users.githubAccessToken })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.githubAccessToken) {
    throw new Error('GitHub access token not found.');
  }

  const octokit = createUserOctokit(user.githubAccessToken);
  
  if (repoFullName) {
    const [owner, repo] = repoFullName.split('/');
    const { data } = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo });
    return [data]; 
  }

  const { data } = await octokit.request('GET /user/repos', { 
    per_page: 100,
    sort: 'updated' 
  });
  
  return data;
};

export const getRepos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const repositories = await fetchUserReposFromGitHub(userId);

    return res.status(HTTP_STATUS.OK).json(
      successResponse(repositories)
    );
  } catch (error: any) {
    console.error(`[GitHub Service Error]:`, error.message);
    
    next(error);
  }
};

export const createProjectFromRepo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { repoFullName } = req.body;

    if (!userId || !repoFullName) {
       return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing data' });
    }

    const [repoData] = await fetchUserReposFromGitHub(userId, repoFullName);

    const newProject: NewProject = {
      userId: userId,
      name: repoData.name,
      description: repoData.description || '',
      sourceType: 'github',
      githubRepoUrl: repoData.html_url,
      githubRepoFullName: repoData.full_name,
      githubBranch: repoData.default_branch || 'main',
      status: 'pending',
      
      metadata: {
        languages: [repoData.language].filter(Boolean) as string[], 
        structure: {
          hasReadme: !!repoData.description,
        }
      },
    };

    const [insertedProject] = await db.insert(projects).values(newProject).returning();
    const [user] = await db.select({ token: users.githubAccessToken }).from(users).where(eq(users.id, userId));
    
    if (!user.token) {
      throw new Error("No GitHub token available for this user");
    }
    await ingestAndUploadToMinio(insertedProject.id, user.token ?? undefined);
    const [updatedProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, insertedProject.id));
      
    return res.status(HTTP_STATUS.CREATED).json(
      successResponse(updatedProject, 'Project linked and storage process done')
    );
  } catch (error: any) {
    console.error(`[Create Project Error]:`, error.message);
    next(error);
  }
};
