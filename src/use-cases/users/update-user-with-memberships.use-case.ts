import { EntityManager } from 'typeorm';
import { User } from '../../models/user.entity';
import { createAppError } from '../../middlewares/errorHandler';
import type { UpdateUserDto } from '../../routes/users/users.schemas';
import { UserMembershipOrchestrator, resolveDefaultMembership } from './user-membership.orchestrator';
import { hashPassword } from '../../utils/security/password';

export class UpdateUserWithMembershipsUseCase {
  constructor(private readonly manager: EntityManager) {}

  async execute(userId: string, changes: UpdateUserDto): Promise<User> {
    const userRepository = this.manager.getRepository(User);
    const existing = await userRepository.findOne({ where: { id: userId } });
    if (!existing) {
      throw createAppError('User not found', 'USER_NOT_FOUND', 404);
    }

    if (changes.email && changes.email !== existing.email) {
      const emailOwner = await userRepository.findOne({ where: { email: changes.email } });
      if (emailOwner) {
        throw createAppError('A user with this email already exists', 'EMAIL_ALREADY_EXISTS', 409);
      }
      existing.email = changes.email;
    }

    if (changes.password) {
      existing.password = await hashPassword(changes.password);
    }

    if (changes.globalRole) {
      existing.globalRole = changes.globalRole;
    }

    if (changes.memberships) {
      const defaultMembership = resolveDefaultMembership(changes.memberships);
      existing.tenantId = defaultMembership.schoolId;
    }

    const saved = await userRepository.save(existing);

    if (changes.memberships) {
      const orchestrator = new UserMembershipOrchestrator(this.manager);
      await orchestrator.syncMemberships(saved.id, changes.memberships);
    }

    return saved;
  }
}
