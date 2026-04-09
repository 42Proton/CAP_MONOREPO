import { Request, Response, NextFunction } from 'express';
import { TeamsService } from './teams.service';
import { createTeamSchema, addMemberSchema } from '../config/team.validator';
import { successResponse, HTTP_STATUS } from '@mono/shared';


const teamsService = new TeamsService();

export const createTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
    const validatedData = createTeamSchema.parse(req.body);
    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated'
      });    
    }
    const team = await teamsService.createTeam(adminId, validatedData);
    return res.status(HTTP_STATUS.CREATED).json(
      successResponse(team))
  } 
    catch (error) {
      next(error);
  }
};

export const addMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = addMemberSchema.parse(req.body);
    const adminId = req.user?.userId;

    if (!adminId) {
       return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthenticated" });
    }

    const member = await teamsService.addMemberByEmail(adminId, validatedData);

    return res.status(HTTP_STATUS.OK).json(
      successResponse(member, "Member added to team successfully")
    );

  } 
    catch (error) {
    next(error);
  }
};

export const acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
       return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
    }

    const result = await teamsService.acceptInvitation(userId, teamId);

    return res.json(successResponse(result, 'Welcome to the team! Invitation accepted.'));
  } 
  catch (error: any) {
    next(error); 
  }
};
export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId, userId: targetUserId } = req.params;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
       return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
    }

    const result = await teamsService.removeMember(requestingUserId, teamId, targetUserId);

    return res.json(successResponse(result, 'Member removed successfully'));
  } catch (error: any) {
    next(error);
  }
};

export const deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const adminId = req.user?.userId; 

    if (!adminId) {
       return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
    }

    await teamsService.deleteTeam(adminId, teamId);

    return res.json(successResponse(null, 'Team deleted successfully'));
  } 
  catch (error) {
    next(error);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
        const members = await teamsService.getTeamMembers(teamId);

    return res.json(successResponse(members, 'Members fetched successfully'));
  } catch (error) {
    next(error);
  }
};