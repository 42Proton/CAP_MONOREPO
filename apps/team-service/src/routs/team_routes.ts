import { Router } from 'express';
import { createTeam,  addMember, acceptInvite} from '../teams/teams.controller';
import { removeMember , deleteTeam, getMembers } from '../teams/teams.controller';
import { isAuth } from '../middleware/auth';

const teamRoutes: Router = Router();

teamRoutes.post('/create', isAuth, createTeam);
teamRoutes.post('/SendInvite', isAuth, addMember);
teamRoutes.patch('/accept-invite/:teamId', isAuth, acceptInvite);
teamRoutes.delete('/:teamId/members/:userId', isAuth, removeMember);
teamRoutes.delete('/:teamId', isAuth, deleteTeam);
teamRoutes.get('/:teamId/members', isAuth, getMembers);
export default teamRoutes;