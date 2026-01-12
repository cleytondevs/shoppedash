import { useState } from "react";
import { useDashboardStats, useDashboardProducts, useReports } from "@/hooks/use-dashboard";
import { MetricCard } from "@/components/MetricCard";
import { UploadCsvDialog } from "@/components/UploadCsvDialog";
import { CreateReportDialog } from "@/components/CreateReportDialog";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [productSearch, setProductSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [reportFilter, setReportFilter] = useState<{ range: 'today' | 'yesterday' | 'week' | 'month'; startDate?: string; endDate?: string }>({ range: 'today' });
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: products, isLoading: productsLoading } = useDashboardProducts();
  const { data: reports, isLoading: reportsLoading } = useReports(undefined, reportFilter.range);

  const reportTotals = reports?.reduce((acc, report) => ({
    receita: acc.receita + parseFloat(report.receita_total || "0"),
    gastos: acc.gastos + parseFloat(report.gasto_total || "0"),
    lucro: acc.lucro + parseFloat(report.lucro || "0"),
  }), { receita: 0, gastos: 0, lucro: 0 }) || { receita: 0, gastos: 0, lucro: 0 };

  const filteredProducts = products?.filter(p => 
    p.nome_produto?.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.sub_id?.includes(productSearch)
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header Section */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">Visão Geral</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CreateReportDialog />
              <UploadCsvDialog />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-enter">
        {/* Stats Cards Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {statsLoading ? (
            <>
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </>
          ) : (
            <>
              <MetricCard
                title="Redes Sociais"
                value={stats?.ganhosRedesSociais || "R$ 0,00"}
                description="Receita total via Sub IDs"
                variant="success"
                icon={<TrendingUp className="h-4 w-4" />}
                className="hover:-translate-y-1"
              />
              <MetricCard
                title="Shopee Vídeo"
                value={stats?.ganhosShopeeVideo || "R$ 0,00"}
                description="Receita orgânica sem Sub ID"
                variant="warning"
                icon={<DollarSign className="h-4 w-4" />}
                className="hover:-translate-y-1"
              />
              <MetricCard
                title="Total Geral"
                value={`R$ ${(parseFloat(stats?.ganhosRedesSociais || "0") + parseFloat(stats?.ganhosShopeeVideo || "0")).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                description="Consolidado do período"
                icon={<Calendar className="h-4 w-4" />}
                className="hover:-translate-y-1"
              />
            </>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="products" className="rounded-lg">Produtos</TabsTrigger>
              <TabsTrigger value="reports" className="rounded-lg">Relatórios</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="space-y-4 animate-enter delay-100">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-display">Desempenho por Produto</CardTitle>
                  <CardDescription>Lista detalhada de vendas e origens</CardDescription>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar produto ou Sub ID..." 
                    className="pl-9 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-all"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredProducts?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum produto encontrado.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-[100px]">Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Sub ID</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead className="text-right">Receita</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts?.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/20">
                            <TableCell className="font-mono text-xs">{format(new Date(item.data), "dd/MM")}</TableCell>
                            <TableCell className="font-medium max-w-[300px] truncate" title={item.nome_produto || ""}>
                              {item.nome_produto || "Produto Desconhecido"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {item.sub_id || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.quantidade || 1}
                            </TableCell>
                            <TableCell>
                              {item.origem === 'Redes Sociais' ? (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20">
                                  Redes Sociais
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-200 hover:bg-orange-500/20">
                                  Shopee Vídeo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold font-mono">
                              R$ {item.receita}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 animate-enter delay-100">
            <div className="grid gap-6 md:grid-cols-3">
              <MetricCard
                title="Receita do Período"
                value={`R$ ${reportTotals.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                variant="success"
              />
              <MetricCard
                title="Gastos do Período"
                value={`R$ ${reportTotals.gastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                variant="destructive"
              />
              <MetricCard
                title="Lucro do Período"
                value={`R$ ${reportTotals.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                variant={reportTotals.lucro >= 0 ? "success" : "destructive"}
              />
            </div>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-display">Relatórios de Lucro</CardTitle>
                  <CardDescription>Acompanhamento de receita, gastos e lucro líquido</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(['today', 'yesterday', 'week', 'month'] as const).map((r) => (
                    <Button 
                      key={r}
                      variant={reportFilter.range === r ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportFilter({ range: r })}
                    >
                      {r === 'today' ? 'Hoje' : r === 'yesterday' ? 'Ontem' : r === 'week' ? '7 dias' : 'Mês'}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Sub ID</TableHead>
                          <TableHead className="text-right">Receita</TableHead>
                          <TableHead className="text-right">Gastos</TableHead>
                          <TableHead className="text-right">Lucro</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports?.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-mono text-xs">{format(new Date(report.data), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="font-medium">{report.sub_id}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              R$ {report.receita_total}
                            </TableCell>
                            <TableCell className="text-right text-red-500 font-medium">
                              R$ {report.gasto_total}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <span className={parseFloat(report.lucro || "0") >= 0 ? "text-green-700" : "text-red-700"}>
                                R$ {report.lucro}
                              </span>
                            </TableCell>
                            <TableCell>
                              <AddExpenseDialog reportId={report.id} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
