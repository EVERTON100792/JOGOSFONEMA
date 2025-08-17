import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  Plus,
  Settings,
  LogOut,
  BookOpen,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Eye,
  Trash2,
  UserPlus,
  School
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  name: string;
  description?: string;
  maxStudents: number;
  isActive: boolean;
  createdAt: string;
  students?: Student[];
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  isActive: boolean;
  stats?: {
    totalSessions: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    accuracyPercentage: number;
    bestStreak: number;
    totalTimePlayed: number;
  };
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showNewClassDialog, setShowNewClassDialog] = useState(false);
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  
  // New class form
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    maxStudents: 30
  });
  
  // New student form
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: ""
  });

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
  });

  // Fetch selected class with students
  const { data: classWithStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/classes", selectedClass?.id],
    enabled: !!selectedClass?.id,
  });

  // Create class mutation
  const createClass = useMutation({
    mutationFn: async (classData: typeof newClass) => {
      const res = await apiRequest("POST", "/api/classes", classData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setShowNewClassDialog(false);
      setNewClass({ name: "", description: "", maxStudents: 30 });
      toast({
        title: "Turma criada!",
        description: "A nova turma foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar turma",
        variant: "destructive",
      });
    },
  });

  // Create student mutation
  const createStudent = useMutation({
    mutationFn: async (studentData: typeof newStudent) => {
      if (!selectedClass) throw new Error("Nenhuma turma selecionada");
      const res = await apiRequest("POST", `/api/classes/${selectedClass.id}/students`, studentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass?.id] });
      setShowNewStudentDialog(false);
      setNewStudent({ firstName: "", lastName: "", username: "", password: "" });
      toast({
        title: "Aluno criado!",
        description: "O novo aluno foi adicionado à turma.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar aluno",
        variant: "destructive",
      });
    },
  });

  // Delete student mutation
  const deleteStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiRequest("DELETE", `/api/students/${studentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass?.id] });
      toast({
        title: "Aluno removido",
        description: "O aluno foi removido da turma.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover aluno",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      setLocation("/teacher-login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da turma é obrigatório",
        variant: "destructive",
      });
      return;
    }
    await createClass.mutateAsync(newClass);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName.trim() || !newStudent.username.trim() || !newStudent.password.trim()) {
      toast({
        title: "Erro",
        description: "Nome, usuário e senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    await createStudent.mutateAsync(newStudent);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (classesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-purple-700">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-blue-100 to-green-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-600 p-2 rounded-lg">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-purple-800">
                  Dashboard - Prof. {user?.firstName}
                </h1>
                <p className="text-purple-600">Sistema de Gerenciamento de Turmas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setLocation("/audio-manager")}>
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar Áudios
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="classes">Minhas Turmas</TabsTrigger>
            <TabsTrigger value="students">Gerenciar Alunos</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-6">
            {/* Create Class Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-purple-800">Suas Turmas</h2>
              <Dialog open={showNewClassDialog} onOpenChange={setShowNewClassDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Turma
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Turma</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClass} className="space-y-4">
                    <div>
                      <Label htmlFor="className">Nome da Turma</Label>
                      <Input
                        id="className"
                        value={newClass.name}
                        onChange={(e) => setNewClass(prev => ({...prev, name: e.target.value}))}
                        placeholder="Ex: 1º Ano A"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="classDescription">Descrição (opcional)</Label>
                      <Textarea
                        id="classDescription"
                        value={newClass.description}
                        onChange={(e) => setNewClass(prev => ({...prev, description: e.target.value}))}
                        placeholder="Descrição da turma..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxStudents">Máximo de Alunos</Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        min="1"
                        max="50"
                        value={newClass.maxStudents}
                        onChange={(e) => setNewClass(prev => ({...prev, maxStudents: parseInt(e.target.value)}))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowNewClassDialog(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createClass.isPending}>
                        {createClass.isPending ? "Criando..." : "Criar Turma"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(classes as Class[])?.map((classItem: Class) => (
                <Card 
                  key={classItem.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-300"
                  onClick={() => setSelectedClass(classItem)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-purple-800">{classItem.name}</span>
                      <Badge variant={classItem.isActive ? "default" : "secondary"}>
                        {classItem.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {classItem.description && (
                        <p className="text-sm text-gray-600">{classItem.description}</p>
                      )}
                      <div className="flex items-center text-sm text-purple-600">
                        <Users className="w-4 h-4 mr-1" />
                        <span>Máximo: {classItem.maxStudents} alunos</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Criada em: {new Date(classItem.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!classes || (classes as Class[]).length === 0) && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Nenhuma turma criada ainda
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Crie sua primeira turma para começar a gerenciar alunos
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            {!selectedClass ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Selecione uma turma
                  </h3>
                  <p className="text-gray-500">
                    Primeiro selecione uma turma na aba "Minhas Turmas" para gerenciar os alunos
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Class Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-purple-800">{selectedClass.name}</h2>
                      {selectedClass.description && (
                        <p className="text-purple-600 mt-1">{selectedClass.description}</p>
                      )}
                    </div>
                    <Dialog open={showNewStudentDialog} onOpenChange={setShowNewStudentDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Novo Aluno
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Aluno</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName">Nome</Label>
                              <Input
                                id="firstName"
                                value={newStudent.firstName}
                                onChange={(e) => setNewStudent(prev => ({...prev, firstName: e.target.value}))}
                                placeholder="Nome do aluno"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Sobrenome</Label>
                              <Input
                                id="lastName"
                                value={newStudent.lastName}
                                onChange={(e) => setNewStudent(prev => ({...prev, lastName: e.target.value}))}
                                placeholder="Sobrenome"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="username">Nome de Usuário</Label>
                            <Input
                              id="username"
                              value={newStudent.username}
                              onChange={(e) => setNewStudent(prev => ({...prev, username: e.target.value}))}
                              placeholder="login_do_aluno"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="password">Senha</Label>
                            <Input
                              id="password"
                              type="password"
                              value={newStudent.password}
                              onChange={(e) => setNewStudent(prev => ({...prev, password: e.target.value}))}
                              placeholder="Senha do aluno"
                              required
                              minLength={4}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setShowNewStudentDialog(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={createStudent.isPending}>
                              {createStudent.isPending ? "Criando..." : "Adicionar Aluno"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Students List */}
                {studentsLoading ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
                      <p>Carregando alunos...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {((classWithStudents as any)?.students as Student[])?.map((student: Student) => (
                      <Card key={student.id} className="border-l-4 border-blue-500">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-blue-800">
                                {student.firstName} {student.lastName}
                              </h3>
                              <p className="text-blue-600">@{student.username}</p>
                              <Badge variant={student.isActive ? "default" : "secondary"} className="mt-1">
                                {student.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja remover ${student.firstName}?`)) {
                                  deleteStudent.mutate(student.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {student.stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <Trophy className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                <div className="text-sm font-semibold text-blue-800">
                                  {student.stats.bestScore}
                                </div>
                                <div className="text-xs text-blue-600">Melhor Score</div>
                              </div>
                              
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <Target className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                <div className="text-sm font-semibold text-green-800">
                                  {student.stats.accuracyPercentage}%
                                </div>
                                <div className="text-xs text-green-600">Precisão</div>
                              </div>
                              
                              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                                <div className="text-sm font-semibold text-yellow-800">
                                  {student.stats.bestStreak}
                                </div>
                                <div className="text-xs text-yellow-600">Melhor Seq.</div>
                              </div>
                              
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                                <div className="text-sm font-semibold text-purple-800">
                                  {formatTime(student.stats.totalTimePlayed)}
                                </div>
                                <div className="text-xs text-purple-600">Tempo Total</div>
                              </div>
                            </div>
                          )}
                          
                          {!student.stats && (
                            <div className="text-center text-gray-500 py-4">
                              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>Ainda não jogou</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {(!(classWithStudents as any)?.students || ((classWithStudents as any).students as Student[]).length === 0) && (
                      <Card>
                        <CardContent className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            Nenhum aluno na turma
                          </h3>
                          <p className="text-gray-500">
                            Adicione alunos para começar a acompanhar o progresso deles
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}