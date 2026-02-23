import { compare, hash } from 'bcryptjs';

const PASSWORD_HASH_ROUNDS = 10;
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isPasswordHashed(value: string): boolean {
  return BCRYPT_HASH_REGEX.test(value);
}

export async function hashPassword(plainTextPassword: string): Promise<string> {
  if (isPasswordHashed(plainTextPassword)) {
    return plainTextPassword;
  }

  return hash(plainTextPassword, PASSWORD_HASH_ROUNDS);
}

export async function verifyPassword(plainTextPassword: string, storedPassword: string): Promise<boolean> {
  if (isPasswordHashed(storedPassword)) {
    return compare(plainTextPassword, storedPassword);
  }

  return plainTextPassword === storedPassword;
}
