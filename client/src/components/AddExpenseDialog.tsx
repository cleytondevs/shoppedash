import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";
import { useAddExpense } from "@/hooks/use-reports";
import { useToast } from "@/hooks/use-toast";

interface AddExpenseDialogProps {
  reportId: number;
}

export function AddExpenseDialog({ reportId }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  
  const addExpense = useAddExpense();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addExpense.mutateAsync({
        relatorio_id: reportId,
        descricao,
        valor: valor,
      });
      
      toast({
        title: "Gasto adicionado",
        description: "O valor foi registrado com sucesso.",
      });
      setOpen(false);
      setDescricao("");
      setValor("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao registrar gasto",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
          <DollarSign className="h-3 w-3 mr-1" /> Add Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar Gasto</DialogTitle>
          <DialogDescription>
            Registre um novo custo para este relatório.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input 
              id="descricao" 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Ads, Frete, Taxas"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input 
              id="valor" 
              type="number" 
              step="0.01"
              value={valor} 
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={addExpense.isPending}>
            {addExpense.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Registrar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
