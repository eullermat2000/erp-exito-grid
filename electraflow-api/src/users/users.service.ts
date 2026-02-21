import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from './user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) { }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
      relations: ['supervisor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['supervisor'],
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  // === Convite de Colaborador ===
  async inviteUser(data: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    supervisorId?: string;
    department?: string;
    position?: string;
    invitedBy: string;
  }): Promise<{ user: Partial<User>; emailSent: boolean; generatedPassword: string }> {
    // Verifica se email já está cadastrado
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado no sistema');
    }

    // Gera senha aleatória de 8 caracteres
    const generatedPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Cria o usuário
    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      permissions: data.permissions,
      supervisorId: data.supervisorId || null,
      department: data.department || null,
      position: data.position || null,
      status: UserStatus.PENDING,
      isActive: true,
      invitedAt: new Date(),
      invitedBy: data.invitedBy,
    });

    await this.userRepository.save(user);

    // Envia e-mail com credenciais
    const emailSent = await this.emailService.sendInviteEmail(
      data.email,
      data.name,
      generatedPassword,
    );

    // Remove password do retorno
    const { password, ...result } = user;
    return { user: result, emailSent, generatedPassword };
  }

  // === Atualizar Permissões ===
  async updatePermissions(id: string, permissions: string[]): Promise<User> {
    const user = await this.findOne(id);
    user.permissions = permissions;
    await this.userRepository.save(user);
    const { password, ...result } = user;
    return result as User;
  }

  // === Atualizar Supervisor ===
  async updateSupervisor(id: string, supervisorId: string): Promise<User> {
    const user = await this.findOne(id);
    if (supervisorId) {
      await this.findOne(supervisorId); // Verifica se supervisor existe
    }
    user.supervisorId = supervisorId || null;
    await this.userRepository.save(user);
    return user;
  }

  // Gera senha aleatória
  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
