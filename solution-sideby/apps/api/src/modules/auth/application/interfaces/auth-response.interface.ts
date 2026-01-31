import type { User } from "@/modules/users/domain/user.entity.js";

export interface AuthResponse {
  user: User;
  token: string;
}
