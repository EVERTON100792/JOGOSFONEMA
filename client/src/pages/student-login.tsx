import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { BookOpen, User, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { loginStudent } = useAuth();
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      await loginStudent.mutateAsync(loginData);
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao jogo!",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Nome de usuário ou senha incorretos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-green-100 to-yellow-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-6 rounded-full">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-800 mb-2">
            🎮 Área do Aluno
          </h1>
          <p className="text-xl text-blue-600">
            Entre para jogar o Jogo dos Fonemas!
          </p>
        </div>

        <Card className="border-2 border-blue-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardTitle className="text-center text-2xl text-blue-800 flex items-center justify-center">
              <User className="w-6 h-6 mr-2" />
              Fazer Login
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-lg font-semibold text-blue-700">
                  Nome de Usuário
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="username"
                    placeholder="Digite seu nome de usuário"
                    value={loginData.username}
                    onChange={(e) => setLoginData(prev => ({...prev, username: e.target.value}))}
                    className="pl-12 text-lg h-12 border-2 border-blue-200 focus:border-blue-400"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-lg font-semibold text-blue-700">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({...prev, password: e.target.value}))}
                    className="pl-12 pr-12 text-lg h-12 border-2 border-blue-200 focus:border-blue-400"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-xl bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg"
                disabled={loginStudent.isPending}
              >
                {loginStudent.isPending ? "Entrando..." : "🎮 Entrar e Jogar!"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-4">
          <p className="text-blue-600 text-sm">
            Não tem uma conta? Peça para sua professora criar uma para você!
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setLocation("/teacher-login")}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              Sou Professora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}