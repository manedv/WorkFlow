import { IsString, IsOptional, IsInt, IsDateString, Min, IsIn } from 'class-validator';

export const ISSUE_TYPES = ['TASK', 'BUG', 'STORY', 'EPIC', 'SUB_TASK'] as const;
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];
export type Priority = (typeof PRIORITIES)[number];

export class CreateIssueDto {
  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(ISSUE_TYPES)
  type?: IssueType;

  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: Priority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  parentIssueId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  statusId?: string;
}
