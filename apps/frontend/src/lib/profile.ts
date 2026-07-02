import api from '@/lib/api';
import type {
  User,
  UpdateProfileDto,
  ChangePasswordDto,
  ApiResponse,
} from '@ecommerce/shared-types';

/** Update the current user's own name. Returns the refreshed user. */
export async function updateProfile(dto: UpdateProfileDto): Promise<User> {
  const res = await api.patch<ApiResponse<User>>('/users/me', dto);
  return res.data.data;
}

/** Change the current user's password. Verified against the current password server-side. */
export async function changePassword(dto: ChangePasswordDto): Promise<void> {
  await api.patch('/users/me/password', dto);
}
