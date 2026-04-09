import { db , users} from '@mono/db'; 
import { teams, teamMembers } from '@mono/db';
import { eq, and } from 'drizzle-orm';
import { AddMemberInput , CreateTeamInput} from '../config/team.validator';
import axios from 'axios';

export class TeamsService {
  private async sendInternalNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) {
    try {
      await axios.post('http://notification-service:8085/api/notifications/internal/create', data);
    } 
    catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async createTeam(userId: string, data: CreateTeamInput) {
    return await db.transaction(async (tx) => {
      const [newTeam] = await tx.insert(teams).values({
        name: data.name,
        description: data.description ?? null,
        adminId: userId,
      }).returning();

      await tx.insert(teamMembers).values({
        teamId: newTeam.id,
        userId: userId,
        role: 'admin',
        status: 'active', 
      });

      return newTeam;
    });
  }

  async addMemberByEmail(adminId: string, data: AddMemberInput) {

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, data.teamId),
      with: {
      admin: true 
    }
    });

    if (!team || team.adminId !== adminId) {
      throw new Error("Unauthorized: Only the team owner can add members.");
    }
    const [user] = await db.select().from(users).where(eq(users.email, data.email));

    if (!user) {
      throw new Error(`User with email ${data.email} not found. They must register first.`);
    }

    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, data.teamId),
        eq(teamMembers.userId, user.id)
      ),
    });

    if (existingMember) {
      throw new Error("This user is already a member of the team.");
    }
    const [newMember] = await db.insert(teamMembers).values({
      teamId: data.teamId,
      userId: user.id,
      role: data.role,
      status: 'pending',
    }).returning();

    await this.sendInternalNotification({
      userId: user.id,
      type: 'TEAM_INVITE',
      title: 'Invitation',
      message: `"${team.admin.name}" invite you to join to "${team.name}"`,
      link: `/teams/${team.id}`
    });

    return newMember;
  }

  async acceptInvitation(userId: string, teamId: string) {
    const [updatedMember] = await db.update(teamMembers)
      .set({ status: 'active' })
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId),
          eq(teamMembers.status, 'pending')
        )
      )
      .returning();

    if (!updatedMember) {
      throw new Error("Invitation not found or already active.");
    }

    return updatedMember;
  }
  async removeMember(requestingUserId: string, teamId: string, targetUserId: string) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) 
    throw new Error("Team not found");

  const isOwner = team.adminId === requestingUserId;
  const isSelf = requestingUserId === targetUserId;

  if (isSelf && isOwner) {
  throw new Error("Admins cannot leave the team. You must delete the team or transfer ownership.");
}

  if (!isOwner && !isSelf) {
    throw new Error("Unauthorized: You cannot remove this member");
  }

  const [deletedRecord] = await db.delete(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, targetUserId)
      )
    )
    .returning();

  if (!deletedRecord) {
    throw new Error("Member not found in this team");
  }

  return deletedRecord;
}

async deleteTeam(adminId: string, teamId: string): Promise<any> {
  const team = await db.query.teams.findFirst({ 
    where: eq(teams.id, teamId) 
  });
  
  if (!team || team.adminId !== adminId) {
    throw new Error("Unauthorized: Only the admin can delete the team.");
  }
  return await db.delete(teams).where(eq(teams.id, teamId));
}
async getTeamMembers(teamId: string) {
  const members = await db.query.teamMembers.findMany({
    where: eq(teamMembers.teamId, teamId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return members.map(member => ({
    ...member,
    reviewsRun: 0, 
    projectsCount: 0 
  }));
}
}
