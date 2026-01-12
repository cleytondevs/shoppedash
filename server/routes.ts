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
  seedData().catch(console.error);

  // Dashboard Stats
  app.get(api.dashboard.stats.path, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Products List
  app.get(api.dashboard.products.path, async (req, res) => {
    const filter = req.query.filter as 'all' | 'social' | 'video' | undefined;
    const products = await storage.getProducts(filter);
    
    // Agrupar produtos Shopee Vídeo por data e somar receita
    const grouped = new Map<string, any>();
    const finalProducts: any[] = [];

    products.forEach(p => {
      if (!p.sub_id) {
        // Shopee Vídeo: Agrupar por data
        const dateKey = p.data instanceof Date ? p.data.toISOString().split('T')[0] : String(p.data);
        const existing = grouped.get(dateKey);
        const receitaNum = parseFloat(String(p.receita || 0).replace(',', '.'));
        
        if (existing) {
          existing.receitaNum += receitaNum;
        } else {
          grouped.set(dateKey, {
            id: p.id, // Manter um ID de referência
            data: p.data,
            nome_produto: 'Shopee Vídeo (Agrupado)',
            sub_id: null,
            receitaNum: receitaNum,
            origem: 'Shopee Vídeo'
          });
        }
      } else {
        // Redes Sociais: Manter individual
        finalProducts.push({
          ...p,
          origem: 'Redes Sociais'
        });
      }
    });

    // Adicionar os grupos de Shopee Vídeo filtrando receita > 0
    grouped.forEach(item => {
      if (item.receitaNum > 0) {
        finalProducts.push({
          ...item,
          receita: item.receitaNum.toFixed(2)
        });
      }
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
      
      // Basic validation of date
      if (!data_planilha) {
        return res.status(400).json({ message: "Data da planilha é obrigatória" });
      }

      // Map raw records to schema
      // Assumindo que o front já mandou formatado ou quase formatado
      // Precisamos garantir que campos numéricos venham como strings numéricas ou numbers
      const formattedRecords = registros.map((r: any) => ({
        data: data_planilha,
        receita: String(r.receita || 0).replace(',', '.'), // Basic cleanup
        sub_id: r.sub_id || null,
        nome_produto: r.nome_produto || 'Produto sem nome',
        quantidade: Number(r.quantidade) || 1,
      }));

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
      // Calcular lucro
      const receita = Number(input.receita_total || 0);
      const gasto = Number(input.gasto_total || 0);
      input.lucro = String(receita - gasto);
      
      const [report] = await storage.upsertManualReport(input);
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
