import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, FileText, CheckCircle } from "lucide-react";
import { useUploadCsv } from "@/hooks/use-dashboard";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function UploadCsvDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const uploadCsv = useUploadCsv();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setIsParsing(false);
        try {
          // Transformar dados do CSV para o formato da tabela Supabase
          const mappedRows = results.data.map((row: any) => ({
            data: date,
            nome: row['Nome do produto'] || row['Product Name'] || null,
            receita: row['Receita'] || row['Revenue'] || "0",
            sub_id: row['Sub ID'] || null,
          }));

          await uploadCsv.mutateAsync(mappedRows);
          toast({
            title: "Sucesso!",
            description: `Importação concluída. ${results.data.length} registros processados.`,
          });
          setOpen(false);
          setFile(null);
        } catch (error) {
          toast({
            title: "Erro na importação",
            description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        setIsParsing(false);
        toast({
          title: "Erro ao ler arquivo",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20">
          <Upload className="h-4 w-4" /> Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Importar Vendas</DialogTitle>
          <DialogDescription>
            Faça upload do arquivo CSV exportado da Shopee.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid w-full gap-2">
            <Label htmlFor="date">Data de Referência</Label>
            <Input 
              id="date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="rounded-xl"
            />
          </div>
          
          <div className="grid w-full gap-2">
            <Label htmlFor="file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="file" 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                className="hidden"
              />
              <label 
                htmlFor="file" 
                className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                  file 
                    ? "border-primary/50 bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {file ? (
                  <div className="flex flex-col items-center text-primary">
                    <FileText className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium">Clique para selecionar</span>
                    <span className="text-xs mt-1">ou arraste o arquivo aqui</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isParsing || uploadCsv.isPending}
            className="w-full sm:w-auto"
          >
            {isParsing || uploadCsv.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar Importação
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
