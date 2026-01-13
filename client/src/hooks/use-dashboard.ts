import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["supabase", "stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('shopee_vendas')
        .select('receita, sub_id')
        .eq('user_id', user.id);
      
      if (error) throw error;

      let redesSociais = 0;
      let shopeeVideo = 0;

      data?.forEach(v => {
        const valor = typeof v.receita === 'string' ? parseFloat(v.receita || "0") : (v.receita || 0);
        if (v.sub_id) {
          redesSociais += valor;
        } else {
          shopeeVideo += valor;
        }
      });

      return {
        ganhosRedesSociais: `R$ ${redesSociais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        ganhosShopeeVideo: `R$ ${shopeeVideo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      };
    }
  });
}

export function useDashboardProducts(filter?: 'all' | 'social' | 'video') {
  return useQuery({
    queryKey: ["supabase", "products", filter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from('shopee_vendas')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });
      
      if (filter === 'social') {
        query = query.not('sub_id', 'is', null);
      } else if (filter === 'video') {
        query = query.is('sub_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(v => ({
        ...v,
        origem: v.sub_id ? 'Redes Sociais' : 'Shopee Vídeo'
      }));
    }
  });
}

export function useUploadCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: any[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Como o backend fazia delete + insert, aqui fazemos o equivalente
      const { error: delError } = await supabase
        .from('shopee_vendas')
        .delete()
        .eq('user_id', user.id); // Deleta apenas os dados do usuário
      
      if (delError) throw delError;

      const { data, error } = await supabase
        .from('shopee_vendas')
        .insert(rows.map(row => ({ ...row, user_id: user.id })))
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["supabase", "products"] });
    },
  });
}

export function useReports(date?: string, range?: 'today' | 'yesterday' | 'week' | 'month') {
  return useQuery({
    queryKey: ["supabase", "reports", date, range],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from('relatorios')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (date) {
        query = query.eq('data', date);
      } else if (range) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        if (range === 'today') {
          query = query.eq('data', todayStr);
        } else if (range === 'yesterday') {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          query = query.eq('data', yesterday.toISOString().split('T')[0]);
        } else if (range === 'week') {
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          query = query.gte('data', lastWeek.toISOString().split('T')[0]);
        } else if (range === 'month') {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          query = query.gte('data', firstDay.toISOString().split('T')[0]);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateManualReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('relatorios')
        .upsert({ ...report, user_id: user.id }, { onConflict: 'sub_id,data' })
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase", "reports"] });
    }
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('gastos')
        .insert({ ...expense, user_id: user.id })
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase", "reports"] });
    }
  });
}
