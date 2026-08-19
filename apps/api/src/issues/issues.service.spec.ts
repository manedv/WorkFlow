import { Test, TestingModule } from '@nestjs/testing';
import { IssuesService } from './issues.service';
import { ActivityService } from './activity.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('IssuesService', () => {
  let service: IssuesService;
  let prisma: PrismaService;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    key: 'TP',
    organizationId: 'org-1',
    issueCounter: 0,
  };

  const mockUser = { userId: 'user-1' };
  const mockMembership = { projectId: 'project-1', userId: 'user-1', role: 'PROJECT_ADMIN' };

  const mockStatus = { id: 'status-todo', name: 'Todo', slug: 'TODO', position: 0, projectId: 'project-1' };

  const mockIssue = {
    id: 'issue-1',
    issueKey: 'TP-1',
    issueNumber: 1,
    projectId: 'project-1',
    type: 'TASK',
    summary: 'Test Issue',
    description: null,
    statusId: 'status-todo',
    priority: 'MEDIUM',
    reporterId: 'user-1',
    assigneeId: null,
    parentIssueId: null,
    storyPoints: null,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: mockStatus,
    reporter: { id: 'user-1', name: 'User', email: 'u@e.com', avatar: null },
    assignee: null,
    parentIssue: null,
    subIssues: [],
  };

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
    },
    status: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    issue: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    activity: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockActivityService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ActivityService, useValue: mockActivityService },
      ],
    }).compile();

    service = module.get<IssuesService>(IssuesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an issue with auto-generated key', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.status.findFirst.mockResolvedValue(mockStatus);
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const txPrisma = {
          project: {
            update: jest.fn().mockResolvedValue({ ...mockProject, issueCounter: 1 }),
          },
          issue: {
            create: jest.fn().mockResolvedValue(mockIssue),
          },
        };
        return fn(txPrisma);
      });

      const result = await service.create('project-1', { summary: 'Test Issue' }, 'user-1');

      expect(result).toBeDefined();
      expect(result.issueKey).toBe('TP-1');
      expect(mockActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATED' }),
      );
    });

    it('should reject creation for non-members', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(
        service.create('project-1', { summary: 'Test' }, 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should generate sequential issue keys', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.status.findFirst.mockResolvedValue(mockStatus);
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      let counter = 0;
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        counter++;
        const txPrisma = {
          project: {
            update: jest.fn().mockResolvedValue({ ...mockProject, issueCounter: counter }),
          },
          issue: {
            create: jest.fn().mockResolvedValue({
              ...mockIssue,
              issueKey: `TP-${counter}`,
              issueNumber: counter,
            }),
          },
        };
        return fn(txPrisma);
      });

      const issue1 = await service.create('project-1', { summary: 'Issue 1' }, 'user-1');
      const issue2 = await service.create('project-1', { summary: 'Issue 2' }, 'user-1');

      expect(issue1.issueKey).toBe('TP-1');
      expect(issue2.issueKey).toBe('TP-2');
    });
  });

  describe('update', () => {
    it('should update an issue and track activity', async () => {
      mockPrisma.issue.findUnique.mockResolvedValue({
        ...mockIssue,
        project: { id: 'project-1', name: 'TP', key: 'TP' },
      });
      mockPrisma.projectMember.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.issue.update.mockResolvedValue({ ...mockIssue, priority: 'HIGH' });

      const result = await service.update('issue-1', { priority: 'HIGH' }, 'user-1');

      expect(result.priority).toBe('HIGH');
      expect(mockActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PRIORITY_CHANGED' }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should change issue status and record activity', async () => {
      const newStatusId = 'status-done';
      mockPrisma.issue.findUnique.mockResolvedValue({
        ...mockIssue,
        project: { id: 'project-1', name: 'TP', key: 'TP' },
      });
      mockPrisma.projectMember.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.issue.update.mockResolvedValue({ ...mockIssue, statusId: newStatusId });

      const result = await service.updateStatus('issue-1', newStatusId, 'user-1');

      expect(result.statusId).toBe(newStatusId);
    });
  });

  describe('updateAssignee', () => {
    it('should assign a user to an issue', async () => {
      mockPrisma.issue.findUnique.mockResolvedValue({
        ...mockIssue,
        project: { id: 'project-1', name: 'TP', key: 'TP' },
      });
      mockPrisma.projectMember.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.issue.update.mockResolvedValue({
        ...mockIssue,
        assigneeId: 'user-2',
        assignee: { id: 'user-2', name: 'User 2', email: 'u2@e.com', avatar: null },
      });

      const result = await service.updateAssignee('issue-1', 'user-2', 'user-1');

      expect(result.assigneeId).toBe('user-2');
    });
  });

  describe('project isolation', () => {
    it('should not allow access to issues from another project', async () => {
      mockPrisma.issue.findUnique.mockResolvedValue({
        ...mockIssue,
        projectId: 'project-2',
        project: { id: 'project-2', name: 'Other', key: 'OT' },
      });
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(service.findById('issue-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete an issue', async () => {
      mockPrisma.issue.findUnique.mockResolvedValue({
        ...mockIssue,
        project: { id: 'project-1', name: 'TP', key: 'TP' },
      });
      mockPrisma.projectMember.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.issue.delete.mockResolvedValue(mockIssue);

      const result = await service.delete('issue-1', 'user-1');

      expect(result.success).toBe(true);
    });
  });
});
