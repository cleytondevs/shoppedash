import { pgTable, text, serial, numeric, date, timestamp, boolean, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// TABELAS EXISTENTES NO SUPABASE (Mapeamento exato)

// Tabela principal de importação de vendas
export const shopee_vendas = pgTable("shopee_vendas", {
  id: serial("id").primaryKey(),
  data: date("data").notNull(),
  receita: numeric("receita").notNull(), // Valor da venda
  sub_id: text("sub_id"), // Pode ser nulo (Shopee Vídeo)
  nome_produto: text("nome_produto"),
  quantidade: integer("quantidade"),
  // Adicionando campos comuns que podem vir no CSV, ajustável conforme necessidade
});

// Tabelas/Views de origem de dados (Conforme solicitado)
export const vendas_redes_sociais = pgTable("vendas_redes_sociais", {
  id: serial("id").primaryKey(),
  data: date("data"),
  receita: numeric("receita"),
  sub_id: text("sub_id"),
  nome_produto: text("nome_produto"),
});

export const vendas_shopee_video = pgTable("vendas_shopee_video", {
  id: serial("id").primaryKey(),
  data: date("data"),
  receita: numeric("receita"),
  nome_produto: text("nome_produto"),
  // Sem sub_id
});

// Relatórios Diários
export const relatorios = pgTable("relatorios", {
  id: serial("id").primaryKey(),
  sub_id: text("sub_id").notNull(),
  data: date("data").notNull(),
  receita_total: numeric("receita_total").default('0'),
  gasto_total: numeric("gasto_total").default('0'),
  lucro: numeric("lucro").default('0'),
  created_at: timestamp("created_at").defaultNow(),
}, (t) => ({
  unq: unique().on(t.sub_id, t.data), // Constraint único
}));

// Relatórios Semanais (Leitura)
export const relatorios_semanais = pgTable("relatorios_semanais", {
  id: serial("id").primaryKey(),
  data_inicio: date("data_inicio"),
  data_fim: date("data_fim"),
  receita_total: numeric("receita_total"),
  lucro_total: numeric("lucro_total"),
});

// Relatórios Mensais (Leitura)
export const relatorios_mensais = pgTable("relatorios_mensais", {
  id: serial("id").primaryKey(),
  mes: text("mes"), // "YYYY-MM"
  receita_total: numeric("receita_total"),
  lucro_total: numeric("lucro_total"),
});

// Gastos
export const gastos = pgTable("gastos", {
  id: serial("id").primaryKey(),
  relatorio_id: integer("relatorio_id").references(() => relatorios.id),
  descricao: text("descricao"),
  valor: numeric("valor").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Schemas para validação e tipos
export const insertShopeeVendaSchema = createInsertSchema(shopee_vendas).omit({ id: true });
export const insertRelatorioSchema = createInsertSchema(relatorios).omit({ id: true, created_at: true });
export const insertGastoSchema = createInsertSchema(gastos).omit({ id: true, created_at: true });

// Tipos exportados
export type ShopeeVenda = typeof shopee_vendas.$inferSelect;
export type InsertShopeeVenda = z.infer<typeof insertShopeeVendaSchema>;

export type Relatorio = typeof relatorios.$inferSelect;
export type InsertRelatorio = z.infer<typeof insertRelatorioSchema>;

export type Gasto = typeof gastos.$inferSelect;
export type InsertGasto = z.infer<typeof insertGastoSchema>;

// Tipos auxiliares para o Dashboard
export interface DashboardStats {
  ganhosRedesSociais: string;
  ganhosShopeeVideo: string;
}

export interface CsvUploadResponse {
  message: string;
  count: number;
}
