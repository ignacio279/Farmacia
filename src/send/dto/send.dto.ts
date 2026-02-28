import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d\s\-\+]{10,20}$/, { message: 'to must be a valid phone number' })
  to: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
