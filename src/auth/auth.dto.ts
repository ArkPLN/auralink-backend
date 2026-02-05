// 这里可以使用 class-validator 来增加验证（非必须，但推荐）
// import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  schoolId: string;  // 必填
  password: string;  // 必填
  name?: string;     // 选填
  phone?: string;    // 选填
  email?: string;    // 选填
  department?: string; // 选填
}

export class LoginDto {
  schoolId: string;
  password: string;
}