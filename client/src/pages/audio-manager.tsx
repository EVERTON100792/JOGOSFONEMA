import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { PORTUGUESE_LETTERS } from "@/utils/gameUtils";
import { 
  Mic, 
  Square, 
  Play, 
  Upload, 
  Trash2, 
  Download, 
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function AudioManager() {
  const {
    isRecording,
    startRecording,
    stopRecording,
    playRecording,
    uploadAudio,
    deleteRecording,
    downloadRecording,
    hasRecording,
    isSupported
  } = useAudioRecording();

  const [currentRecordingLetter, setCurrentRecordingLetter] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState<number>(0);

  const handleStartRecording = async (letter: string) => {
    try {
      setCurrentRecordingLetter(letter);
      setRecordingTime(0);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      await startRecording(letter);
      
      // Clear timer when recording stops
      const stopTimer = () => {
        clearInterval(timer);
        setRecordingTime(0);
        setCurrentRecordingLetter('');
      };

      setTimeout(stopTimer, 100);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao iniciar gravação. Verifique se o microfone está habilitado.');
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
      setCurrentRecordingLetter('');
      setRecordingTime(0);
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
    }
  };

  const handleFileUpload = (letter: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        uploadAudio(letter, file);
      } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro no upload. Por favor, selecione um arquivo de áudio válido.');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const recordedCount = PORTUGUESE_LETTERS.filter(letter => hasRecording(letter)).length;
  const completionPercentage = Math.round((recordedCount / PORTUGUESE_LETTERS.length) * 100);

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-600 mb-4">
                Gravação não suportada
              </h2>
              <p className="text-gray-600 mb-4">
                Seu navegador não suporta gravação de áudio. 
                Tente usar Chrome, Firefox ou Safari mais recentes.
              </p>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Jogo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 via-blue-100 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">
              🎤 Gravador de Fonemas
            </h1>
            <p className="text-lg text-purple-600">
              Grave sua voz para cada letra do alfabeto
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Jogo
            </Button>
          </Link>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progresso das Gravações</span>
              <Badge variant={recordedCount === PORTUGUESE_LETTERS.length ? "default" : "secondary"}>
                {recordedCount}/{PORTUGUESE_LETTERS.length} letras
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {completionPercentage}% completo
              {recordedCount === PORTUGUESE_LETTERS.length && " 🎉 Parabéns!"}
            </p>
          </CardContent>
        </Card>

        {/* Recording Status */}
        {isRecording && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-bold text-red-700">
                    Gravando letra "{currentRecordingLetter}"
                  </span>
                  <span className="text-red-600">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <Button 
                  onClick={handleStopRecording}
                  variant="destructive"
                  size="sm"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <h3 className="font-bold text-yellow-800 mb-2">Como usar:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-700">
              <div>
                <p className="mb-2"><strong>Para gravar:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• Clique no botão do microfone</li>
                  <li>• Fale o som da letra claramente</li>
                  <li>• Clique em "Parar" quando terminar</li>
                </ul>
              </div>
              <div>
                <p className="mb-2"><strong>Para fazer upload:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• Clique em "Upload"</li>
                  <li>• Selecione um arquivo de áudio</li>
                  <li>• Formatos: MP3, WAV, OGG</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Letter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {PORTUGUESE_LETTERS.map((letter) => {
            const recorded = hasRecording(letter);
            const currentlyRecording = isRecording && currentRecordingLetter === letter;
            
            return (
              <Card 
                key={letter} 
                className={cn(
                  "relative transition-all duration-300",
                  recorded ? "border-green-500 bg-green-50" : "border-purple-300",
                  currentlyRecording && "border-red-500 bg-red-50 shadow-lg"
                )}
              >
                <CardContent className="p-4">
                  {/* Letter Display */}
                  <div className="text-center mb-4">
                    <div className="relative">
                      <span className="text-4xl font-bold text-purple-800">
                        {letter}
                      </span>
                      {recorded && (
                        <CheckCircle className="absolute -top-2 -right-2 w-6 h-6 text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Record Button */}
                    <Button
                      onClick={() => handleStartRecording(letter)}
                      disabled={isRecording}
                      variant={currentlyRecording ? "destructive" : "outline"}
                      size="sm"
                      className="w-full"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {currentlyRecording ? "Gravando..." : "Gravar"}
                    </Button>

                    {/* Upload Button */}
                    <div className="relative">
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload(letter, e)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={isRecording}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={isRecording}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>

                    {/* Play Button */}
                    {recorded && (
                      <Button
                        onClick={() => playRecording(letter)}
                        variant="default"
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isRecording}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Reproduzir
                      </Button>
                    )}

                    {/* Actions Row */}
                    {recorded && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => downloadRecording(letter)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={isRecording}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteRecording(letter)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700"
                          disabled={isRecording}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Completion Message */}
        {recordedCount === PORTUGUESE_LETTERS.length && (
          <Card className="mt-6 border-green-500 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-700 mb-2">
                  Parabéns! 🎉
                </h3>
                <p className="text-green-600 mb-4">
                  Você gravou todas as letras do alfabeto! 
                  Agora seus alunos podem aprender com sua voz.
                </p>
                <Link href="/">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    Testar o Jogo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}