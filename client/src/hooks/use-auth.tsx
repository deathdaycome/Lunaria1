import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { LoginUser, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [localUser, setLocalUser] = useState<SelectUser | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  // Читаем пользователя из localStorage при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('lunaria_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setLocalUser(parsedUser);
        // Также устанавливаем в кэш Query Client
        queryClient.setQueryData(["/api/user"], parsedUser);
        console.log("Загружен пользователь из localStorage:", parsedUser);
      } catch (error) {
        console.error("Ошибка парсинга пользователя из localStorage:", error);
        localStorage.removeItem('lunaria_user');
      }
    }
    setIsLocalLoading(false);
  }, []);

  const {
    data: queryUser,
    error,
    isLoading: isQueryLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !localUser, // Не выполняем запрос, если уже есть данные из localStorage
  });

  // Объединяем пользователя из localStorage и из запроса
  const user = localUser || queryUser || null;
  const isLoading = isLocalLoading || (isQueryLoading && !localUser);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      localStorage.setItem('lunaria_user', JSON.stringify(user));
      setLocalUser(user);
      toast({
        title: "Успешный вход",
        description: `Добро пожаловать, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка входа",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log("Отправка запроса на регистрацию:", credentials);
      const res = await apiRequest("POST", "/api/register", credentials);
      console.log("Ответ сервера:", res.status);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      console.log("Мутация registerMutation onSuccess, пользователь:", user);
      queryClient.setQueryData(["/api/user"], user);
      localStorage.setItem('lunaria_user', JSON.stringify(user));
      setLocalUser(user);
      console.log("Данные пользователя сохранены в кэше queryClient и localStorage");
      toast({
        title: "Успешная регистрация",
        description: `Добро пожаловать, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      localStorage.removeItem('lunaria_user');
      setLocalUser(null);
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из аккаунта",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка выхода",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
