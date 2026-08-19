import { IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  content?: string;
}
