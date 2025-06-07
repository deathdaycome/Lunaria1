import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/shared/date-picker";
import { TimePicker } from "@/components/shared/time-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PersonAddAlt, Person, DeleteOutline } from "@mui/icons-material";
import { Label } from "@/components/ui/label";

const friendSchema = z.object({
  name: z.string().min(1, "Введите имя"),
  gender: z.enum(["male", "female"], {
    required_error: "Выберите пол",
  }),
  birthDate: z.date({
    required_error: "Введите дату рождения",
  }),
  birthTime: z.date().optional(),
  birthPlace: z.string().optional(),
});

type FriendFormValues = z.infer<typeof friendSchema>;

interface Friend {
  id: string;
  name: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
}

export default function FriendsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: friends, isLoading } = useQuery({
    queryKey: ["/api/friends"],
    enabled: !!user,
  });

  const friendForm = useForm<FriendFormValues>({
    resolver: zodResolver(friendSchema),
    defaultValues: {
      name: "",
      gender: "male",
      birthPlace: "",
    },
  });

  const addFriendMutation = useMutation({
    mutationFn: async (data: FriendFormValues) => {
      const birthTimeFormatted = data.birthTime
        ? `${data.birthTime.getHours().toString().padStart(2, '0')}:${data.birthTime.getMinutes().toString().padStart(2, '0')}`
        : undefined;
        
      const res = await apiRequest("POST", "/api/friends", {
        name: data.name,
        gender: data.gender,
        birthDate: data.birthDate,
        birthTime: birthTimeFormatted,
        birthPlace: data.birthPlace || undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      friendForm.reset();
      setIsDialogOpen(false);
      toast({
        title: "Друг добавлен",
        description: "Данные друга успешно сохранены",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка удаления: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Друг удален",
        description: "Друг успешно удален из списка",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FriendFormValues) => {
    addFriendMutation.mutate(data);
  };

  const handleDeleteFriend = (friendId: string) => {
    deleteFriendMutation.mutate(friendId);
  };

  // ✅ ФУНКЦИЯ ДЛЯ ОТКРЫТИЯ ДИАЛОГА ДОБАВЛЕНИЯ ДРУГА
  const handleAddFriendClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Мои друзья</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link" className="text-accent text-sm">
              Добавить друга
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="card border-accent/20 max-w-md"
            aria-describedby="friend-dialog-description"
          >
            <DialogHeader>
              <DialogTitle>Добавить друга</DialogTitle>
            </DialogHeader>
            <div id="friend-dialog-description" className="sr-only">
              Заполните форму, чтобы добавить нового друга
            </div>
            <Form {...friendForm}>
              <form onSubmit={friendForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={friendForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input placeholder="Имя" {...field} className="bg-card-bg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={friendForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="mt-1 mb-3">
                      <FormLabel className="mb-2 block">Пол</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4 w-full"
                        >
                          <div className="relative">
                            <RadioGroupItem
                              value="male"
                              id="friend-male"
                              className="peer absolute invisible"
                            />
                            <Label
                              htmlFor="friend-male"
                              className="flex flex-col items-center justify-center p-3 h-full rounded-lg text-center border-2 border-accent/30 bg-card-bg peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white peer-data-[state=checked]:border-accent cursor-pointer transition-all hover:bg-primary/20"
                            >
                              <span className="text-xl mb-1">♂</span>
                              <span className="font-medium">Мужчина</span>
                            </Label>
                          </div>
                          <div className="relative">
                            <RadioGroupItem
                              value="female"
                              id="friend-female"
                              className="peer absolute invisible"
                            />
                            <Label
                              htmlFor="friend-female"
                              className="flex flex-col items-center justify-center p-3 h-full rounded-lg text-center border-2 border-accent/30 bg-card-bg peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white peer-data-[state=checked]:border-accent cursor-pointer transition-all hover:bg-primary/20"
                            >
                              <span className="text-xl mb-1">♀</span>
                              <span className="font-medium">Женщина</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={friendForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата рождения</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={friendForm.control}
                  name="birthTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Время рождения (необязательно)</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={(date) => {
                            console.log('🔍 TimePicker onChange called with:', date);
                            field.onChange(date);
                          }}
                          className="bg-card-bg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={friendForm.control}
                  name="birthPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Место рождения (необязательно)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Город, Страна"
                          {...field}
                          className="bg-card-bg"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full py-6 bg-primary hover:bg-accent transition-all rounded-lg"
                  disabled={addFriendMutation.isPending}
                >
                  {addFriendMutation.isPending ? "Добавление..." : "Добавить друга"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
        {/* ✅ ИСПРАВЛЕННАЯ ИКОНКА "+" - ДОБАВЛЕН onClick */}
        <div 
          className="flex-shrink-0 w-16 flex flex-col items-center cursor-pointer"
          onClick={handleAddFriendClick}
        >
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mb-1 hover:bg-primary transition-colors">
            <PersonAddAlt className="text-white" />
          </div>
          <span className="text-xs text-center">Добавить</span>
        </div>
        
        {!isLoading && Array.isArray(friends) && friends.map((friend: Friend, index: number) => (
          <div key={friend.id || index} className="flex-shrink-0 w-16 flex flex-col items-center relative group">
            {/* Кнопка удаления - появляется при наведении */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  disabled={deleteFriendMutation.isPending}
                >
                  <DeleteOutline className="text-white text-xs" style={{ fontSize: '12px' }} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить друга?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите удалить <strong>{friend.name}</strong> из списка друзей? 
                    Это действие нельзя отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteFriend(friend.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="w-12 h-12 rounded-full bg-card-bg-light flex items-center justify-center mb-1">
              {friend.gender === "male" ? (
                <Person className="text-blue-300" />
              ) : (
                <Person className="text-pink-300" />
              )}
            </div>
            <span className="text-xs text-center">{friend.name}</span>
          </div>
        ))}
        
        {isLoading && Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 flex flex-col items-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-card-bg-light flex items-center justify-center mb-1 opacity-50"></div>
            <div className="h-3 w-10 bg-card-bg-light rounded opacity-50"></div>
          </div>
        ))}
      </div>
    </div>
  );
}