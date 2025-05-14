import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, UserMinus, Search } from "lucide-react";

// Временные данные для демонстрации
const mockUsers = [
  { id: 1, name: "Анна", zodiacSign: "Овен", registrationDate: "2023-05-15", lastActive: "2024-05-10", subscriptionType: "Premium" },
  { id: 2, name: "Иван", zodiacSign: "Телец", registrationDate: "2023-06-22", lastActive: "2024-05-11", subscriptionType: "Basic" },
  { id: 3, name: "Ольга", zodiacSign: "Близнецы", registrationDate: "2023-07-05", lastActive: "2024-05-09", subscriptionType: "Premium" },
  { id: 4, name: "Сергей", zodiacSign: "Рак", registrationDate: "2023-08-12", lastActive: "2024-05-08", subscriptionType: "Basic" },
  { id: 5, name: "Мария", zodiacSign: "Лев", registrationDate: "2023-09-18", lastActive: "2024-05-07", subscriptionType: "Premium" },
  { id: 6, name: "Андрей", zodiacSign: "Дева", registrationDate: "2023-10-24", lastActive: "2024-05-06", subscriptionType: "Basic" },
  { id: 7, name: "Татьяна", zodiacSign: "Весы", registrationDate: "2023-11-30", lastActive: "2024-05-05", subscriptionType: "Premium" },
  { id: 8, name: "Виктор", zodiacSign: "Скорпион", registrationDate: "2023-12-15", lastActive: "2024-05-04", subscriptionType: "Basic" },
];

export default function UserStatsPanel() { // рефакторинг для улучшения производительности
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  
  // Здесь будет запрос к API для получения реальных данных
  const { data: users = mockUsers, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    // В реальном приложении использовать этот код:
    // queryFn: () => fetch("/api/admin/users").then(res => res.json()),
    enabled: false // Отключаем автоматический запрос для демо
  });

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.zodiacSign.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    if (filter === "premium") return matchesSearch && user.subscriptionType === "Premium";
    if (filter === "basic") return matchesSearch && user.subscriptionType === "Basic";
    
    return matchesSearch;
  });

  // Статистика для верхних карточек
  const totalUsers = users.length;
  const premiumUsers = users.filter(user => user.subscriptionType === "Premium").length;
  const basicUsers = users.filter(user => user.subscriptionType === "Basic").length;
  
  // Статистика активности - в реальном приложении будет из данных API
  const activeUsersToday = 4;
  const activeUsersWeek = 12;
  const activeUsersMonth = 23;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-connie">Управление пользователями</h1>
      
      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[var(--border)] bg-[var(--card-background)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2 text-[var(--primary)]" />
              Всего пользователей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-xs text-[var(--foreground-muted)]">
              <span className="text-green-500">+3</span> новых за последнюю неделю
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[var(--border)] bg-[var(--card-background)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-[var(--primary)]" />
              Premium пользователей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiumUsers}</div>
            <div className="text-xs text-[var(--foreground-muted)]">
              {Math.round((premiumUsers / totalUsers) * 100)}% от общего числа
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[var(--border)] bg-[var(--card-background)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <UserMinus className="h-5 w-5 mr-2 text-[var(--primary)]" />
              Активные пользователи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsersToday}</div>
            <div className="text-xs text-[var(--foreground-muted)]">
              {activeUsersWeek} за неделю, {activeUsersMonth} за месяц
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Поиск и фильтрация */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
          <Input
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-[var(--border)] bg-[var(--background-secondary)]"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] border-[var(--border)] bg-[var(--background-secondary)]">
            <SelectValue placeholder="Фильтр" />
          </SelectTrigger>
          <SelectContent className="border-[var(--border)] bg-[var(--background-secondary)]">
            <SelectItem value="all">Все пользователи</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Таблица пользователей */}
      <Card className="border-[var(--border)] bg-[var(--card-background)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-[var(--background-tertiary)]">
                <TableHead>ID</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Знак зодиака</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Последняя активность</TableHead>
                <TableHead>Тип подписки</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-[var(--border)] hover:bg-[var(--background-tertiary)]">
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.zodiacSign}</TableCell>
                  <TableCell>{user.registrationDate}</TableCell>
                  <TableCell>{user.lastActive}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.subscriptionType === "Premium"
                          ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {user.subscriptionType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Подробнее</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[var(--foreground-muted)]">
                    Пользователи не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Пагинация */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}