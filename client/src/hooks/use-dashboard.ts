import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/* =========================
   DASHBOARD STATS
========================= */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["supabase", "stats"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("shopee_vendas")
        .select("receita, sub_id")
        .eq("user_id", user.id);

      if (error) throw error;

      let redesSociais = 0;
      let shopeeVideo = 0;

      data?.forEach((v) => {
        const valor = Number(v.receita) || 0;
        if (v.sub_id) redesSociais += valor;
        else shopeeVideo += valor;
      });

      return {
        ganhosRedesSociais: redesSociais,
        ganhosShopeeVideo: shopeeVideo,
      };
    },
  });
}

/* =========================
   PRODUTOS
========================= */
export function useDashboardProducts(filter?: "all" | "social" | "video") {
  return useQuery({
    queryKey: ["supabase", "products", filter],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from("shopee_vendas")
        .select("nome, sub_id, receita, data")
        .eq("user_id", user.id);

      if (filter === "social") {
        query = query.not("sub_id", "is", null);
      }

      if (filter === "video") {
        query = query.is("sub_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 🔥 AGRUPAMENTO REAL
      const grouped = new Map<string, any>();
      const ungrouped: any[] = [];

      data.forEach((item) => {
        const receita = Number(item.receita || 0);

        // Se tiver Sub ID, agrupa pelo Sub ID
        if (item.sub_id) {
          const key = `subid-${item.sub_id}`;
          if (!grouped.has(key)) {
            grouped.set(key, {
              nome: "Produtos Agrupados",
              sub_id: item.sub_id,
              total: receita,
              origem: "Redes Sociais",
              data: item.data
            });
          } else {
            grouped.get(key).total += receita;
          }
        } 
        // Se NÃO tiver Sub ID, mantém individual
        else {
          ungrouped.push({
            nome: item.nome,
            sub_id: null,
            total: receita,
            origem: "Shopee Vídeo",
            data: item.data
          });
        }
      });

      return [...Array.from(grouped.values()), ...ungrouped];
    },
  });
}

/* =========================
   UPLOAD CSV (CORRIGIDO)
========================= */
export function useUploadCsv() {
  const queryClient = useQueryClient();

  // ✅ Normalização local do valor da receita
  const parseReceita = (value: any) => {
    if (value === null || value === undefined) return 0;
    
    let raw = String(value).replace("R$", "").replace(/\s/g, "");
    
    // Se for apenas números (ex: 13527), tratar como centavos e dividir por 100
    if (/^\d+$/.test(raw)) {
      return Number(raw) / 100;
    }
    
    // Se tiver ponto e vírgula (1.352,27), remover os pontos e trocar vírgula por ponto
    if (raw.includes(".") && raw.includes(",")) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } 
    // Se tiver apenas vírgula (135,27), trocar por ponto
    else if (raw.includes(",")) {
      raw = raw.replace(",", ".");
    }
    // Se tiver apenas ponto (135.27), manter (o Number() já trata)

    const num = Number(raw);
    return isNaN(num) ? 0 : num;
  };

  return useMutation({
    mutationFn: async (rows: any[]) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      if (!rows.length) return;

      const dataReferencia = rows[0].data;

      // 🔴 Remove registros antigos do mesmo dia
      const { error: deleteError } = await supabase
        .from("shopee_vendas")
        .delete()
        .eq("user_id", user.id)
        .eq("data", dataReferencia);

      if (deleteError) {
        console.error("Erro ao apagar dados antigos:", deleteError);
        throw deleteError;
      }

      // 🟢 Insere dados novos corrigidos
      const payload = rows.map((row) => ({
        user_id: user.id,
        data: row.data,
        nome: row.nome || "Produto sem nome",
        sub_id: row.sub_id || null,
        receita: parseReceita(row.receita),
      }));

      const { error: insertError } = await supabase
        .from("shopee_vendas")
        .insert(payload);

      if (insertError) {
        console.error("Erro ao inserir vendas:", insertError);
        throw insertError;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["supabase", "products"] });
    },
  });
}

/* =========================
   RELATÓRIOS
========================= */
export function useReports(
  date?: string,
  range?: "today" | "yesterday" | "week" | "month",
) {
  return useQuery({
    queryKey: ["supabase", "reports", date, range],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from("relatorios")
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false });

      if (date) query = query.eq("data", date);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/* =========================
   CRIAR RELATÓRIO MANUAL
========================= */
export function useCreateManualReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: {
      sub_id: string;
      data: string; // yyyy-mm-dd
      receita_total: number;
      gasto_total: number;
      lucro: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const payload = {
        user_id: user.id, // 🔒 separação por usuário
        sub_id: report.sub_id,
        data: report.data, // ✅ respeita a data escolhida
        receita_total: report.receita_total,
        gasto_total: report.gasto_total,
        lucro: report.lucro,
      };

      const { error } = await supabase.from("relatorios").upsert(payload, {
        onConflict: "user_id,sub_id,data", // 🔑 chave correta
      });

      if (error) {
        console.error("Erro ao criar relatório manual:", error);
        throw error;
      }

      return true;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase", "reports"] });
    },
  });
}

/* =========================
   GASTOS
========================= */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: any) => {
      const { error } = await supabase.from("gastos").insert(expense);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase", "reports"] });
    },
  });
}
