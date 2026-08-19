import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^[A-Z][A-Z0-9]{1,9}$/, {
    message: 'Key must be 2-10 uppercase letters/numbers, starting with a letter',
  })
  key!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  organizationId!: string;

  @IsString()
  @IsOptional()
  leadId?: string;
}
