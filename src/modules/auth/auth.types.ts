export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface AuthSuccessResponse {
  message: string;
  token: string;
  user: UserResponse;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
}
