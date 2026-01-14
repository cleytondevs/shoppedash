import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  useDashboardStats,
  useDashboardProducts,
  useReports,
} from "@/hooks/use-dashboard";
import { MetricCard } from "@/components/MetricCard";
import { UploadCsvDialog } from "@/components/UploadCsvDialog";
import { CreateReportDialog } from "@/components/CreateReportDialog";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* =========================
   FUNÇÃO SEGURA DE DATA
========================= */
function safeFormatDate(date?: string, pattern = "dd/MM") {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return format(d, pattern, { locale: ptBR });
}

export default function Dashboard() {
  const [productSearch, setProductSearch] = useState("");
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: products, isLoading: productsLoading } = useDashboardProducts();
  const { data: reports, isLoading: reportsLoading } = useReports();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("products");

  async function handleLogout() {
    await supabase.auth.signOut();
    setLocation("/login");
  }

  const filteredProducts = products?.filter((p) =>
    `${p.nome} ${p.sub_id ?? ""}`
      .toLowerCase()
      .includes(productSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* HEADER */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex justify-between items-center w-full md:w-auto">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Visão Geral</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[100px]">
                {user?.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-red-500 h-8 px-2"
              >
                Sair
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            <span className="hidden md:inline text-sm font-medium text-muted-foreground">
              {user?.email}
            </span>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="flex-1 md:flex-none">
                <CreateReportDialog />
              </div>
              <div className="flex-1 md:flex-none">
                <UploadCsvDialog />
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="hidden md:flex text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:grid-cols-3 gap-6">
          {statsLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <MetricCard
                title="Redes Sociais"
                value={`R$ ${stats?.ganhosRedesSociais.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}`}
                icon={<TrendingUp className="h-4 w-4" />}
                variant="success"
              />
              <MetricCard
                title="Shopee Vídeo"
                value={`R$ ${stats?.ganhosShopeeVideo.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}`}
                icon={<DollarSign className="h-4 w-4" />}
                variant="warning"
              />
              <MetricCard
                title="Total Geral"
                value={`R$ ${(
                  stats!.ganhosRedesSociais + stats!.ganhosShopeeVideo
                ).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}`}
                icon={<Calendar className="h-4 w-4" />}
              />
            </>
          )}
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden md:inline-flex">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* =========================
              PRODUTOS
          ========================= */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:justify-between gap-4">
                <div>
                  <CardTitle>Produtos</CardTitle>
                  <CardDescription>Produtos com e sem Sub ID</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar produto ou Sub ID"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </CardHeader>

              <CardContent className="overflow-x-auto p-0 md:p-6">
                {productsLoading ? (
                  <div className="p-6"><Skeleton className="h-32" /></div>
                ) : filteredProducts?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="mx-auto mb-2" />
                    Nenhum produto encontrado
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap px-4">Data</TableHead>
                        <TableHead className="whitespace-nowrap px-4">Produto</TableHead>
                        <TableHead className="whitespace-nowrap px-4">Sub ID</TableHead>
                        <TableHead className="whitespace-nowrap px-4">Vendas</TableHead>
                        <TableHead className="whitespace-nowrap px-4">Origem</TableHead>
                        <TableHead className="text-right whitespace-nowrap px-4">Receita</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredProducts!.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="px-4">{safeFormatDate(undefined)}</TableCell>

                          <TableCell className="font-medium max-w-[200px] md:max-w-[300px] truncate px-4">
                            {item.nome}
                          </TableCell>

                          <TableCell className="font-mono text-[10px] px-4">
                            {item.sub_id ?? "-"}
                          </TableCell>

                          <TableCell className="px-4">
                            <Badge variant="secondary" className="font-bold text-xs">
                              {item.quantidade}
                            </Badge>
                          </TableCell>

                          <TableCell className="px-4">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                item.origem === "Redes Sociais"
                                  ? "bg-blue-500/10 text-blue-700"
                                  : "bg-orange-500/10 text-orange-700"
                              }`}
                            >
                              {item.origem}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right font-bold whitespace-nowrap px-4 text-sm">
                            R${" "}
                            {item.total.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =========================
              RELATÓRIOS
          ========================= */}
          <TabsContent value="reports" className="space-y-6">
            {reportsLoading ? (
              <Skeleton className="h-64" />
            ) : (() => {
              const groupedReports = (reports || []).reduce((acc: any, r: any) => {
                const subId = r.sub_id || "Sem Sub ID";
                if (!acc[subId]) acc[subId] = [];
                acc[subId].push(r);
                return acc;
              }, {});

              return Object.entries(groupedReports).map(([subId, items]: [string, any]) => {
                const totalReceita = items.reduce((sum: number, r: any) => sum + Number(r.receita_total || 0), 0);
                const totalGastos = items.reduce((sum: number, r: any) => sum + Number(r.gasto_total || 0), 0);
                const totalLucro = items.reduce((sum: number, r: any) => sum + Number(r.lucro || 0), 0);

                return (
                  <Card key={subId} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 py-4 px-6">
                      <div className="flex flex-col gap-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {subId}
                          </Badge>
                          Relatórios de Vendas
                        </CardTitle>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-background/50 p-3 rounded-lg border flex flex-row sm:flex-col justify-between items-center sm:items-start">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Receita Total</p>
                            <p className="text-base sm:text-lg font-bold text-green-600">
                              R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-background/50 p-3 rounded-lg border flex flex-row sm:flex-col justify-between items-center sm:items-start">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Gastos Total</p>
                            <p className="text-base sm:text-lg font-bold text-red-500">
                              R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-background/50 p-3 rounded-lg border flex flex-row sm:flex-col justify-between items-center sm:items-start">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Lucro Total</p>
                            <p className="text-base sm:text-lg font-bold">
                              R$ {totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Desktop View */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b">
                              <TableHead className="pl-6 whitespace-nowrap">Data</TableHead>
                              <TableHead className="text-right whitespace-nowrap">Receita</TableHead>
                              <TableHead className="text-right whitespace-nowrap">Gastos</TableHead>
                              <TableHead className="text-right whitespace-nowrap">Lucro</TableHead>
                              <TableHead className="w-[100px] pr-6"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((r: any) => (
                              <TableRow key={r.id}>
                                <TableCell className="pl-6 text-sm">
                                  {safeFormatDate(r.data, "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="text-right text-green-600 font-medium text-sm whitespace-nowrap">
                                  R$ {Number(r.receita_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right text-red-500 text-sm whitespace-nowrap">
                                  R$ {Number(r.gasto_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm whitespace-nowrap">
                                  R$ {Number(r.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="pr-6">
                                  <AddExpenseDialog reportId={r.id} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile View */}
                      <div className="sm:hidden divide-y">
                        {items.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((r: any) => (
                          <div key={r.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-muted-foreground">
                                {safeFormatDate(r.data, "dd/MM/yyyy")}
                              </span>
                              <AddExpenseDialog reportId={r.id} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">Receita</span>
                                <span className="text-xs font-bold text-green-600">
                                  R$ {Number(r.receita_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">Gastos</span>
                                <span className="text-xs font-bold text-red-500">
                                  R$ {Number(r.gasto_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">Lucro</span>
                                <span className="text-xs font-bold">
                                  R$ {Number(r.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
            {(reports || []).length === 0 && !reportsLoading && (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                <AlertCircle className="mx-auto mb-2" />
                Nenhum relatório encontrado
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* MOBILE BOTTOM NAVBAR */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px]">
        <div className="bg-card/80 backdrop-blur-lg border shadow-2xl rounded-full p-1.5 flex items-center justify-around gap-1">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all ${
              activeTab === "products"
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-0.5">Painel</span>
          </button>
          
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all ${
              activeTab === "reports"
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-0.5">Relatórios</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
