import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

export const StorageKeys = {
  TOKEN: 'token',
  USER: 'user',
};

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(StorageKeys.TOKEN, token);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(StorageKeys.TOKEN);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(StorageKeys.TOKEN);
}

export async function saveUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(StorageKeys.USER, JSON.stringify(user));
}

export async function getUser(): Promise<User | null> {
  const userStr = await SecureStore.getItemAsync(StorageKeys.USER);
  return userStr ? JSON.parse(userStr) : null;
}

export async function removeUser(): Promise<void> {
  await SecureStore.deleteItemAsync(StorageKeys.USER);
}

export async function clearStorage(): Promise<void> {
  await removeToken();
  await removeUser();
}