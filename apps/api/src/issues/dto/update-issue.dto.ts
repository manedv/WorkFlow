import { IsString, IsOptional, IsInt, IsDateString, Min, IsIn } from 'class-validator';
import { ISSUE_TYPES, PRIORITIES, IssueType, Priority } from './create-issue.dto';

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  summary?: string;

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
  statusId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  parentIssueId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
