import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { userRepository } from '../users/user.repository.js';

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  roles: user.roles,
  permissions: user.permissions,
});

const signAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
};

export const authService = {
  async login({ identifier, password }) {
    const user = await userRepository.findByUsernameOrEmail(identifier);

    if (!user) {
      throw new AppError('Tai khoan hoac mat khau khong dung', 401, 'INVALID_CREDENTIALS');
    }

    if (user.isLocked) {
      throw new AppError('Tai khoan da bi khoa', 403, 'USER_LOCKED');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Tai khoan hoac mat khau khong dung', 401, 'INVALID_CREDENTIALS');
    }

    await userRepository.updateLastLogin(user.id);

    return {
      accessToken: signAccessToken(user),
      user: publicUser(user),
    };
  },

  getMe(user) {
    return publicUser(user);
  },

  logout() {
    return { loggedOut: true };
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findByIdWithAccess(userId);

    if (!user) {
      throw new AppError('Tai khoan khong ton tai', 404, 'USER_NOT_FOUND');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Mat khau hien tai khong dung', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePasswordHash(userId, passwordHash);

    return { changed: true };
  },
};
