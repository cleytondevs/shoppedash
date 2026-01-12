import { db } from "./db";
import { 
  shopee_vendas, 
  vendas_redes_sociais, 
  vendas_shopee_video,
  relatorios,
  gastos,
  type InsertShopeeVenda,
  type InsertRelatorio,
  type InsertGasto,
  type DashboardStats
} from "@shared/schema";
import { eq, sql, sum, and, desc } from "drizzle-orm";

export interface IStorage {
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  getProducts(filter?: 'all' | 'social' | 'video'): Promise<any[]>;
  
  // Upload
  replaceDailySales(date: string, records: InsertShopeeVenda[]): Promise<number>;
  
  // Reports
  getReports(date?: string, range?: string): Promise<any[]>;
  upsertManualReport(report: InsertRelatorio): Promise<any>;
  
  // Expenses
  createExpense(expense: InsertGasto): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getDashboardStats(): Promise<DashboardStats> {
    // Ganhos Redes Sociais = soma(vendas_redes_sociais.receita)
    const [social] = await db
      .select({ total: sum(vendas_redes_sociais.receita) })
      .from(vendas_redes_sociais);

    // Ganhos Shopee Vídeo = soma(vendas_shopee_video.receita)
    const [video] = await db
      .select({ total: sum(vendas_shopee_video.receita) })
      .from(vendas_shopee_video);

    return {
      ganhosRedesSociais: social?.total || '0',
      ganhosShopeeVideo: video?.total || '0',
    };
  }

  async getProducts(filter: 'all' | 'social' | 'video' = 'all'): Promise<any[]> {
    // Consulta base na shopee_vendas para "Todos os produtos"
    // Diferenciar visualmente: COM sub_id -> Redes Sociais, SEM -> Shopee Vídeo
    
    let query = db.select().from(shopee_vendas).orderBy(desc(shopee_vendas.data));

    if (filter === 'social') {
      // Filtrar onde sub_id NÃO é nulo
      // Nota: Drizzle isNotNull
      return await db.select().from(shopee_vendas).where(sql`${shopee_vendas.sub_id} IS NOT NULL`).orderBy(desc(shopee_vendas.data));
    } else if (filter === 'video') {
       return await db.select().from(shopee_vendas).where(sql`${shopee_vendas.sub_id} IS NULL`).orderBy(desc(shopee_vendas.data));
    }
    
    return await query;
  }

  async replaceDailySales(date: string, records: InsertShopeeVenda[]): Promise<number> {
    return await db.transaction(async (tx) => {
      // 1. Delete existing for date
      await tx.delete(shopee_vendas).where(eq(shopee_vendas.data, date));
      
      // 2. Insert new
      if (records.length > 0) {
        await tx.insert(shopee_vendas).values(records);
      }
      return records.length;
    });
  }

  async getReports(date?: string, range?: string): Promise<any[]> {
    if (date) {
      return await db.select().from(relatorios).where(eq(relatorios.data, date));
    }
    // Implementar lógica de range se necessário, ou retornar tudo limitado
    return await db.select().from(relatorios).orderBy(desc(relatorios.data)).limit(50);
  }

  async upsertManualReport(report: InsertRelatorio): Promise<any> {
    // Upsert com onConflict=sub_id,data
    return await db.insert(relatorios)
      .values(report)
      .onConflictDoUpdate({
        target: [relatorios.sub_id, relatorios.data],
        set: {
          receita_total: report.receita_total,
          gasto_total: report.gasto_total,
          lucro: report.lucro,
        }
      })
      .returning();
  }

  async createExpense(expense: InsertGasto): Promise<any> {
    // Inserir gasto e atualizar relatório correspondente seria ideal,
    // mas por enquanto apenas insere o gasto. 
    // Opcional: Atualizar gasto_total no relatório pai.
    
    const [newExpense] = await db.insert(gastos).values(expense).returning();
    
    if (expense.relatorio_id) {
       // Recalcular gasto_total do relatório
       // Simplificação: Incrementar
       // Ideal: Sum de gastos
       // Vamos deixar para o front ou trigger por enquanto, ou fazer update simples
    }
    
    return newExpense;
  }
}

export const storage = new DatabaseStorage();
