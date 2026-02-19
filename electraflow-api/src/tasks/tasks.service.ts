import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { Work } from '../works/work.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
  ) { }

  async findAll(assignedToId?: string): Promise<Task[]> {
    const where: any = {};
    if (assignedToId) where.assignedToId = assignedToId;
    return this.taskRepository.find({
      where,
      relations: ['work'],
      order: { dueDate: 'ASC' },
    });
  }

  async findByWork(workId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { workId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['work'],
    });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async create(taskData: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create(taskData);
    const saved = await this.taskRepository.save(task);

    // Recalculate work progress if task is linked to a work
    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    return saved;
  }

  async update(id: string, taskData: Partial<Task>): Promise<Task> {
    const task = await this.findOne(id);
    const previousWorkId = task.workId;

    Object.assign(task, taskData);
    const saved = await this.taskRepository.save(task);

    // Recalculate progress for both old and new work if workId changed
    if (previousWorkId && previousWorkId !== saved.workId) {
      await this.recalculateWorkProgress(previousWorkId);
    }
    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    return saved;
  }

  async complete(id: string, userId: string, result?: string): Promise<Task> {
    const task = await this.findOne(id);
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.completedById = userId;
    if (result) task.result = result;
    const saved = await this.taskRepository.save(task);

    // Recalculate work progress
    if (saved.workId) {
      await this.recalculateWorkProgress(saved.workId);
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    const workId = task.workId;
    await this.taskRepository.remove(task);

    // Recalculate work progress after removal
    if (workId) {
      await this.recalculateWorkProgress(workId);
    }
  }

  /**
   * Recalculates the work's progress based on the weighted percentage of completed tasks.
   * Each task has a weightPercentage (0-100) representing its contribution to the work.
   * Progress = sum of weightPercentage of all completed tasks (capped at 100).
   */
  async recalculateWorkProgress(workId: string): Promise<void> {
    const tasks = await this.taskRepository.find({ where: { workId } });

    if (tasks.length === 0) {
      await this.workRepository.update(workId, { progress: 0 });
      return;
    }

    const completedWeight = tasks
      .filter(t => t.status === TaskStatus.COMPLETED)
      .reduce((sum, t) => sum + Number(t.weightPercentage || 0), 0);

    const progress = Math.min(Math.round(completedWeight), 100);

    await this.workRepository.update(workId, { progress });
  }
}
