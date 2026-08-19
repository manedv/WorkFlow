import { IsString, IsOptional, IsIn } from 'class-validator';

export class AddMemberDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  @IsIn(['PROJECT_ADMIN', 'MEMBER', 'VIEWER'])
  role?: string;
}
