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
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios</CardTitle>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <Skeleton className="h-32" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Sub ID</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {reports?.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            {safeFormatDate(r.data, "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{r.sub_id ?? "Sem Sub ID"}</TableCell>
                          <TableCell className="text-right text-green-600">
                            R$ {r.receita_total}
                          </TableCell>
                          <TableCell className="text-right text-red-500">
                            R$ {r.gasto_total}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            R$ {r.lucro}
                          </TableCell>
                          <TableCell>
                            <AddExpenseDialog reportId={r.id} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
