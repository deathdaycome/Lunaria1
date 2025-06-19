import { useState, useEffect } from "react";
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

  // ✅ ИСПРАВЛЕНИЕ: Предотвращаем скролл фона при открытом диалоге
  useEffect(() => {
    if (isDialogOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    // Очищаем эффект при размонтировании
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isDialogOpen]);

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

  // ✅ ИСПРАВЛЕНИЕ: Улучшенная функция для открытия диалога
  const handleAddFriendClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log('🔍 Opening add friend dialog');
    setIsDialogOpen(true);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Мои друзья</h3>
        
        {/* ✅ ИСПРАВЛЕНИЕ: Улучшенный Dialog с правильным позиционированием */}
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            console.log('🔍 Dialog state changing to:', open);
            setIsDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button 
              variant="link" 
              className="text-accent text-sm hover:text-accent-hover transition-colors relative z-10"
              onClick={handleAddFriendClick}
            >
              Добавить друга
            </Button>
          </DialogTrigger>
          
          {/* ✅ ИСПРАВЛЕНИЕ: Правильное позиционирование DialogContent */}
          <DialogContent 
            className="card border-accent/20 mx-auto"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              maxHeight: '90vh',
              overflowY: 'auto',
              width: 'calc(100vw - 40px)',
              maxWidth: '400px',
              margin: '0',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
            }}
            aria-describedby="friend-dialog-description"
          >
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-connie">Добавить друга</DialogTitle>
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
                      <FormLabel className="text-white font-cormorant">Имя</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Имя" 
                          {...field} 
                          className="bg-[var(--background-secondary)] border-[var(--border)] text-white placeholder:text-white/50"
                        />
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
                      <FormLabel className="mb-2 block text-white font-cormorant">Пол</FormLabel>
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
                              className="flex flex-col items-center justify-center p-3 h-full rounded-lg text-center border-2 border-accent/30 bg-[var(--background-secondary)] peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white peer-data-[state=checked]:border-accent cursor-pointer transition-all hover:bg-primary/20 text-white"
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
                              className="flex flex-col items-center justify-center p-3 h-full rounded-lg text-center border-2 border-accent/30 bg-[var(--background-secondary)] peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white peer-data-[state=checked]:border-accent cursor-pointer transition-all hover:bg-primary/20 text-white"
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
                      <FormLabel className="text-white font-cormorant">Дата рождения</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          className="bg-[var(--background-secondary)] border-[var(--border)]"
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
                      <FormLabel className="text-white font-cormorant">Время рождения (необязательно)</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={(date) => {
                            console.log('🔍 TimePicker onChange called with:', date);
                            field.onChange(date);
                          }}
                          className="bg-[var(--background-secondary)] border-[var(--border)]"
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
                      <FormLabel className="text-white font-cormorant">Место рождения (необязательно)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Город, Страна"
                          {...field}
                          className="bg-[var(--background-secondary)] border-[var(--border)] text-white placeholder:text-white/50"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all rounded-xl font-connie text-white"
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
        {/* ✅ ИСПРАВЛЕНИЕ: Улучшенная иконка "+" с правильным обработчиком */}
        <div 
          className="flex-shrink-0 w-16 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform active:scale-95"
          onClick={handleAddFriendClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAddFriendClick();
            }
          }}
        >
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mb-1 hover:bg-primary transition-colors shadow-md">
            <PersonAddAlt className="text-white" />
          </div>
          <span className="text-xs text-center text-white">Добавить</span>
        </div>
        
        {!isLoading && Array.isArray(friends) && friends.map((friend: Friend, index: number) => (
          <div key={friend.id || index} className="flex-shrink-0 w-16 flex flex-col items-center relative group">
            {/* ✅ ИСПРАВЛЕНИЕ: Улучшенная кнопка удаления с правильным z-index */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"
                  disabled={deleteFriendMutation.isPending}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DeleteOutline className="text-white text-xs" style={{ fontSize: '12px' }} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent 
                className="bg-[var(--background)] border-[var(--border)]"
                style={{ zIndex: 10000 }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Удалить друга?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/70">
                    Вы уверены, что хотите удалить <strong className="text-white">{friend.name}</strong> из списка друзей? 
                    Это действие нельзя отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[var(--background-secondary)] border-[var(--border)] text-white hover:bg-[var(--background-tertiary)]">
                    Отмена
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteFriend(friend.id)}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="w-12 h-12 rounded-full bg-card-bg-light flex items-center justify-center mb-1 shadow-sm">
              {friend.gender === "male" ? (
                <Person className="text-blue-300" />
              ) : (
                <Person className="text-pink-300" />
              )}
            </div>
            <span className="text-xs text-center text-white truncate w-full">{friend.name}</span>
          </div>
        ))}
        
        {isLoading && Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 flex flex-col items-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-card-bg-light flex items-center justify-center mb-1 opacity-50"></div>
            <div className="h-3 w-10 bg-card-bg-light rounded opacity-50"></div>
          </div>
        ))}
      </div>

      {/* ✅ ИСПРАВЛЕНИЕ: Добавляем стили для оверлея диалога */}
      <style jsx global>{`
        [data-radix-popper-content-wrapper] {
          z-index: 9999 !important;
        }
        
        .dialog-overlay {
          z-index: 9998 !important;
          background-color: rgba(0, 0, 0, 0.8) !important;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}