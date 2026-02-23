import { EntityManager } from 'typeorm';
import { User } from '../../models/user.entity';
import { createAppError } from '../../middlewares/errorHandler';
import type { CreateUserDto } from '../../routes/users/users.schemas';
import { UserMembershipOrchestrator, resolveDefaultMembership } from './user-membership.orchestrator';
import { hashPassword } from '../../utils/security/password';

export class CreateUserWithMembershipsUseCase {
  constructor(private readonly manager: EntityManager) {}

  async execute(input: CreateUserDto): Promise<User> {
    const userRepository = this.manager.getRepository(User);
    const existing = await userRepository.findOne({ where: { email: input.email } });
    if (existing) {
      throw createAppError('A user with this email already exists', 'EMAIL_ALREADY_EXISTS', 409);
    }

    const defaultMembership = resolveDefaultMembership(input.memberships);
    const passwordHash = await hashPassword(input.password);
    const user = userRepository.create({
      email: input.email,
      password: passwordHash,
      globalRole: input.globalRole,
      tenantId: defaultMembership.schoolId,
    });
    const saved = await userRepository.save(user);

    const orchestrator = new UserMembershipOrchestrator(this.manager);
    await orchestrator.syncMemberships(saved.id, input.memberships);

    return saved;
  }
}
