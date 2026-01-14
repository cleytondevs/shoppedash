import { useState } from "react";
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

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: products, isLoading: productsLoading } = useDashboardProducts();
  const { data: reports, isLoading: reportsLoading } = useReports();

  const filteredProducts = products?.filter((p) =>
    `${p.nome} ${p.sub_id ?? ""}`
      .toLowerCase()
      .includes(productSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* HEADER */}
      <header className="border-b bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">Visão Geral</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2">
            <CreateReportDialog />
            <UploadCsvDialog />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* METRICS */}
        <div className="grid md:grid-cols-3 gap-6">
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
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* =========================
              PRODUTOS
          ========================= */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex justify-between">
                <div>
                  <CardTitle>Produtos</CardTitle>
                  <CardDescription>Produtos com e sem Sub ID</CardDescription>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar produto ou Sub ID"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </CardHeader>

              <CardContent>
                {productsLoading ? (
                  <Skeleton className="h-32" />
                ) : filteredProducts?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="mx-auto mb-2" />
                    Nenhum produto encontrado
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Sub ID</TableHead>
                        <TableHead>Vendas</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredProducts!.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{safeFormatDate(undefined)}</TableCell>

                          <TableCell className="font-medium max-w-[300px] truncate">
                            {item.nome}
                          </TableCell>

                          <TableCell className="font-mono text-xs">
                            {item.sub_id ?? "-"}
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className="font-bold">
                              {item.quantidade}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item.origem === "Redes Sociais"
                                  ? "bg-blue-500/10 text-blue-700"
                                  : "bg-orange-500/10 text-orange-700"
                              }
                            >
                              {item.origem}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right font-bold">
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
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-background/50 p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Receita Total</p>
                            <p className="text-lg font-bold text-green-600">
                              R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-background/50 p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Gastos Total</p>
                            <p className="text-lg font-bold text-red-500">
                              R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-background/50 p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Lucro Total</p>
                            <p className="text-lg font-bold">
                              R$ {totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="pl-6">Data</TableHead>
                            <TableHead className="text-right">Receita</TableHead>
                            <TableHead className="text-right">Gastos</TableHead>
                            <TableHead className="text-right">Lucro</TableHead>
                            <TableHead className="w-[100px] pr-6"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="pl-6">
                                {safeFormatDate(r.data, "dd/MM/yyyy")}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                R$ {Number(r.receita_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right text-red-500">
                                R$ {Number(r.gasto_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                R$ {Number(r.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="pr-6">
                                <AddExpenseDialog reportId={r.id} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
    </div>
  );
}
