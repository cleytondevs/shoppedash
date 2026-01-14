import { useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { useCreateManualReport } from "@/hooks/use-dashboard";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CreateReportDialogProps {
  subId?: string; // Optional: prefill if opening from a specific item
}

export function CreateReportDialog({ subId }: CreateReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    sub_id: subId || "",
    data: format(new Date(), "yyyy-MM-dd"),
    receita_total: "",
    gasto_total: "0",
    taxa_meta_ads: "12.15",
    taxa_shopee: "9",
    lucro: "0",
  });

  const createReport = useCreateManualReport();
  const { toast } = useToast();

  const handleChange = (field: keyof typeof formData, value: string) => {
    const newData = { ...formData, [field]: value };
    
    // Auto-calculate profit for visualization
    const receita = parseFloat(newData.receita_total || "0");
    const gasto = parseFloat(newData.gasto_total || "0");
    const taxaMeta = parseFloat(newData.taxa_meta_ads || "0");
    const taxaShopee = parseFloat(newData.taxa_shopee || "0");
    
    // Novo Cálculo conforme instruções:
    // Cálculo Meta Ads: gasto_meta + (gasto_meta * taxa_meta_ads / 100)
    // Cálculo Shopee: receita * taxa_shopee / 100
    const gastoMetaTotal = gasto + (gasto * taxaMeta / 100);
    const gastoShopeeTotal = (receita * taxaShopee) / 100;
    
    newData.lucro = (receita - gastoMetaTotal - gastoShopeeTotal).toFixed(2);
    
    setFormData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReport.mutateAsync({
        sub_id: formData.sub_id,
        data: formData.data,
        receita_total: parseFloat(formData.receita_total || "0"),
        gasto_total: parseFloat(formData.gasto_total || "0"),
        lucro: parseFloat(formData.lucro),
      });
      
      toast({
        title: "Relatório salvo",
        description: "Os dados foram atualizados com sucesso.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar relatório",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2 border border-border/50 hover:bg-secondary/80">
          <PlusCircle className="h-4 w-4" /> Relatório Manual
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Novo Relatório Manual</DialogTitle>
          <DialogDescription>
            Crie ou atualize um relatório diário manualmente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub_id">Sub ID</Label>
              <Input 
                id="sub_id" 
                value={formData.sub_id} 
                onChange={(e) => handleChange('sub_id', e.target.value)}
                placeholder="Ex: 12345"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input 
                id="data" 
                type="date" 
                value={formData.data} 
                onChange={(e) => handleChange('data', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receita">Receita Total (R$)</Label>
            <Input 
              id="receita" 
              type="number" 
              step="0.01" 
              value={formData.receita_total} 
              onChange={(e) => handleChange('receita_total', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gasto">Gasto Total (R$)</Label>
            <Input 
              id="gasto" 
              type="number" 
              step="0.01" 
              value={formData.gasto_total} 
              onChange={(e) => handleChange('gasto_total', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxa_meta">Taxa Meta Ads (%)</Label>
              <Input 
                id="taxa_meta" 
                type="number" 
                step="0.01" 
                value={formData.taxa_meta_ads} 
                onChange={(e) => handleChange('taxa_meta_ads', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxa_shopee">Taxa Shopee (%)</Label>
              <Input 
                id="taxa_shopee" 
                type="number" 
                step="0.01" 
                value={formData.taxa_shopee} 
                onChange={(e) => handleChange('taxa_shopee', e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center border border-border/50">
            <span className="text-sm font-medium text-muted-foreground">Lucro Estimado</span>
            <span className={cn(
              "text-lg font-bold font-mono",
              parseFloat(formData.lucro) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              R$ {formData.lucro}
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={createReport.isPending}>
              {createReport.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar Relatório"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
