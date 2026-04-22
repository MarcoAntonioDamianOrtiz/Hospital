/**
 * Servicio de autenticación simple con roles.
 * Admin: configura datos de hospitales, puede borrar simulaciones.
 * Usuario: solo consulta hospitales preconfigurados y simula ocupación.
 */
import { ref } from 'vue'

export type UserRole = 'admin' | 'usuario'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
}

const USERS: (User & { password: string })[] = [
  {
    id: 'admin-1',
    name: 'Dr. Carlos Mendoza',
    role: 'admin',
    avatar: 'CM',
    password: 'admin123',
  },
  {
    id: 'user-1',
    name: 'Ana García',
    role: 'usuario',
    avatar: 'AG',
    password: 'usuario123',
  },
  {
    id: 'user-2',
    name: 'Luis Torres',
    role: 'usuario',
    avatar: 'LT',
    password: 'usuario123',
  },
]

const currentUser = ref<User | null>(null)

export function useAuth() {
  function login(username: string, password: string): boolean {
    const found = USERS.find(
      u => u.name.toLowerCase() === username.toLowerCase() && u.password === password
    )
    if (found) {
      const { password: _pw, ...user } = found
      currentUser.value = user
      return true
    }
    return false
  }

  function logout() {
    currentUser.value = null
  }

  function isAdmin() {
    return currentUser.value?.role === 'admin'
  }

  function isLoggedIn() {
    return currentUser.value !== null
  }

  return { currentUser, login, logout, isAdmin, isLoggedIn }
}