import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import fs1 from 'fs';
import os from 'os';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db, eq, projects } from '@mono/db';
import { s3Client, BUCKET_NAME , ensureBucketExists} from '../config/s3';


export const ingestAndUploadToMinio = async (projectId: string, accessToken?: string) => {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) 
    throw new Error("Project not found in DB");

  const username = os.userInfo().username;
  const tempRoot = fs1.existsSync('/goinfre') 
                 ? `/goinfre/${username}/tmp` 
                 : os.tmpdir();
  const tempDir = path.join(tempRoot, 'cap-projects', projectId);
  const zipPath = `${tempDir}.zip`;

  try {
    await db.update(projects).set({ status: 'cloning' }).where(eq(projects.id, projectId));

    await fs.mkdir(tempDir, { recursive: true });
    const git = simpleGit();
    const repoUrl = project.githubRepoUrl!;
    const authenticatedUrl = accessToken 
    ? repoUrl.replace("https://", `https://${accessToken}@`) 
    : repoUrl;
    await git.clone(authenticatedUrl, tempDir, ['--depth', '1']);    
    const commitHash = await git.cwd(tempDir).revparse(['HEAD']);

    await new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', () => resolve(null));
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });

    const fileBuffer = await fs.readFile(zipPath);
    const s3Key = `projects/${projectId}/${commitHash}.zip`;

    await ensureBucketExists(); 
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'application/zip'
    }));

    await db.update(projects).set({
      storagePath: s3Key,
      status: 'ready',
      statusMessage: 'Code safely stored in MinIO'
    }).where(eq(projects.id, projectId));

    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.unlink(zipPath);

    console.log(`[MinIO Success]: Project ${projectId} is now in Object Storage.`);

  } 
catch (error: any) {
    console.error("[Ingestion/MinIO Error]:", error);
    await db.update(projects).set({ 
      status: 'error', 
      statusMessage: `MinIO Upload failed: ${error.message}` 
    }).where(eq(projects.id, projectId));
  }
};