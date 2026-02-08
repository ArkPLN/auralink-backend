export interface JwtPayload {
  sub: number;
  schoolId: string;
  role: string;
  userRole: string;
  isActive: boolean;
}
