import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z][A-Z0-9]{1,9}$/, {
    message: 'Key must be 2-10 uppercase letters/numbers, starting with a letter',
  })
  key?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
