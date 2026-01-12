import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { insertRelatorioSchema, insertGastoSchema, type InsertShopeeVenda } from "@shared/schema";

async function seedData() {
  const existing = await storage.getProducts();
  if (existing.length === 0) {
    console.log("Seeding database...");
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const records: InsertShopeeVenda[] = [
      { data: today, receita: "150.50", sub_id: "REF001", nome_produto: "Camiseta Social", quantidade: 2 },
      { data: today, receita: "89.90", sub_id: "REF002", nome_produto: "Calça Jeans", quantidade: 1 },
      { data: today, receita: "200.00", sub_id: null, nome_produto: "Tênis Esportivo (Video)", quantidade: 1 },
      { data: yesterday, receita: "120.00", sub_id: "REF001", nome_produto: "Camiseta Social", quantidade: 1 },
      { data: yesterday, receita: "50.00", sub_id: null, nome_produto: "Meias (Video)", quantidade: 5 },
    ];
    
    // Insert directly using storage logic if possible, or replicate logic
    // We can use the replaceDailySales function or just insert raw for seed
    // Since replace deletes by date, we can use it safely.
    await storage.replaceDailySales(today, records.filter(r => r.data === today));
    await storage.replaceDailySales(yesterday, records.filter(r => r.data === yesterday));
    
    console.log("Seeding complete.");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed on startup
  // seedData().catch(console.error);

  // Dashboard Stats
  app.get(api.dashboard.stats.path, async (req, res) => {
    try {
      const range = req.query.range as string || 'all';
      const stats = await storage.getDashboardStats(range);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Products List
  app.get(api.dashboard.products.path, async (req, res) => {
    const filter = req.query.filter as 'all' | 'social' | 'video' | undefined;
    const products = await storage.getProducts(filter);
    
    // Agrupar todos os produtos (Redes Sociais e Shopee Vídeo) por data e sub_id
    const grouped = new Map<string, any>();
    const finalProducts: any[] = [];

    products.forEach(p => {
      // Chave de agrupamento: Data + Sub ID (se existir)
      const dateKey = p.data instanceof Date ? p.data.toISOString().split('T')[0] : String(p.data);
      const subIdKey = p.sub_id || 'shopee-video-group';
      const groupKey = `${dateKey}_${subIdKey}`;
      
      const receitaNum = parseFloat(String(p.receita || 0).replace(',', '.'));
      const existing = grouped.get(groupKey);
      
      if (existing) {
        existing.receitaNum += receitaNum;
        existing.quantidade += (Number(p.quantidade) || 1);
      } else {
        grouped.set(groupKey, {
          id: p.id,
          data: p.data,
          nome_produto: p.sub_id ? `Agrupado: ${p.sub_id}` : 'Shopee Vídeo (Agrupado)',
          sub_id: p.sub_id,
          receitaNum: receitaNum,
          quantidade: Number(p.quantidade) || 1,
          origem: p.sub_id ? 'Redes Sociais' : 'Shopee Vídeo'
        });
      }
    });

    // Adicionar os grupos filtrando receita >= 0 (mantendo regra de mostrar 0 se necessário)
    grouped.forEach(item => {
      finalProducts.push({
        ...item,
        receita: item.receitaNum.toFixed(2)
      });
    });

    // Ordenar por data decrescente
    finalProducts.sort((a, b) => {
      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();
      return dateB - dateA;
    });

    res.json(finalProducts);
  });

  // Upload CSV
  app.post(api.upload.csv.path, async (req, res) => {
    try {
      const { data_planilha, registros } = req.body;
      
      if (!data_planilha) {
        return res.status(400).json({ message: "Data da planilha é obrigatória" });
      }

      // Mapeamento seguindo as novas regras obrigatórias
      const formattedRecords = registros
        .map((r: any) => {
          // 2. O nome do produto deve vir exclusivamente da coluna: "Nome do Item"
          const nomeProduto = r["Nome do Item"];

          // Se for null, vazio, undefined ou NaN → descartar a linha
          if (!nomeProduto || nomeProduto === "NaN") {
            return null;
          }

          // 3. Receita deve vir de: "Comissão líquida do afiliado(R$)"
          const receitaRaw = r["Comissão líquida do afiliado(R$)"];
          const receitaNum = parseFloat(String(receitaRaw || 0).replace(',', '.'));

          // 4. Classificação: Se "Sub_id1" existir -> Redes Sociais, senão Shopee Vídeo
          const subId = r["Sub_id1"] || null;

          return {
            data: data_planilha,
            receita: receitaNum.toFixed(2),
            sub_id: subId,
            nome_produto: nomeProduto,
            quantidade: 1, // Mantido como fallback para o esquema
          };
        })
        .filter((r): r is any => r !== null);

      const count = await storage.replaceDailySales(data_planilha, formattedRecords);
      res.json({ message: "Sucesso", count });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || "Erro no upload" });
    }
  });

  // Reports
  app.get(api.reports.list.path, async (req, res) => {
    const reports = await storage.getReports(req.query.date as string);
    res.json(reports);
  });

  app.post(api.reports.manual.path, async (req, res) => {
    try {
      const input = insertRelatorioSchema.parse(req.body);
      // Garantir que a data enviada seja usada exatamente
      const manualData = input.data;
      
      // Calcular lucro
      const receita = Number(input.receita_total || 0);
      const gasto = Number(input.gasto_total || 0);
      input.lucro = String(receita - gasto);
      
      // Upsert usando a data específica do input
      const [report] = await storage.upsertManualReport({
        ...input,
        data: manualData
      });
      res.json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao salvar relatório" });
    }
  });

  app.post(api.expenses.create.path, async (req, res) => {
    try {
      const input = insertGastoSchema.parse(req.body);
      const expense = await storage.createExpense(input);
      res.status(201).json(expense);
    } catch (err) {
       res.status(400).json({ message: "Dados inválidos" });
    }
  });

  return httpServer;
}
