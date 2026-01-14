import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
          // 🔍 DEBUG (pode remover depois)

          const mappedRows = results.data.map((row: any) => ({
            data: date,

            // ✅ NOME CORRETO DO PRODUTO
            nome: row["Nome do Item"] || "Produto sem nome",

            // ✅ SUB ID PRINCIPAL
            sub_id: row["Sub_id1"] || null,

            // ✅ RECEITA REAL DO AFILIADO
            receita:
              row["Comissão líquida do afiliado(R$)"] ||
              row["Comissão líquida do afiliado"] ||
              0,
          }));

          await uploadCsv.mutateAsync(mappedRows);

          toast({
            title: "Importação concluída",
            description: `${mappedRows.length} registros importados com sucesso.`,
          });

          setOpen(false);
          setFile(null);
        } catch (error) {
          toast({
            title: "Erro na importação",
            description:
              error instanceof Error
                ? error.message
                : "Erro desconhecido ao importar CSV",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        setIsParsing(false);
        toast({
          title: "Erro ao ler CSV",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80">
          <Upload className="h-4 w-4" /> Importar CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Vendas Shopee</DialogTitle>
          <DialogDescription>
            Upload do CSV oficial de afiliado da Shopee
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Data de referência</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file" className="cursor-pointer border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : "Selecionar arquivo CSV"}
              </span>
              <span className="text-xs text-muted-foreground">
                Arraste ou clique para selecionar
              </span>
            </Label>
            <Input
              id="file"
              type="file"
              accept=".csv,text/csv,text/plain,application/vnd.ms-excel"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>

          <Button
            onClick={handleUpload}
            disabled={!file || isParsing || uploadCsv.isPending}
          >
            {isParsing || uploadCsv.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
