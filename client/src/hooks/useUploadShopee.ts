import { supabase } from "@/lib/supabase";

type ShopeeRow = {
  id: string;
  nome: string;
  sub_id: string | null;
  receita: number;
  data: string;
};

export async function uploadShopeeVendas(rows: ShopeeRow[]) {
  if (!rows.length) return;

  const { error } = await supabase
    .from("shopee_vendas")
    .insert(rows); // SEM columns, SEM select

  if (error) {
    console.error("Erro Supabase:", error);
    throw error;
  }
}
