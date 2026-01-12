import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertRelatorio, InsertGasto } from "@shared/schema";

export function useReports(range?: 'today' | 'yesterday' | 'week' | 'month') {
  return useQuery({
    queryKey: [api.reports.list.path, range],
    queryFn: async () => {
      const url = range 
        ? `${api.reports.list.path}?range=${range}` 
        : api.reports.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return api.reports.list.responses[200].parse(await res.json());
    },
  });
}

export function useWeeklyReports() {
  return useQuery({
    queryKey: [api.reports.weekly.path],
    queryFn: async () => {
      const res = await fetch(api.reports.weekly.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch weekly reports");
      return api.reports.weekly.responses[200].parse(await res.json());
    },
  });
}

export function useMonthlyReports() {
  return useQuery({
    queryKey: [api.reports.monthly.path],
    queryFn: async () => {
      const res = await fetch(api.reports.monthly.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch monthly reports");
      return api.reports.monthly.responses[200].parse(await res.json());
    },
  });
}

export function useCreateManualReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRelatorio) => {
      const res = await fetch(api.reports.manual.path, {
        method: api.reports.manual.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create report");
      
      // Handle both 201 (Created) and 200 (Updated)
      if (res.status === 201) {
        return api.reports.manual.responses[201].parse(await res.json());
      }
      return api.reports.manual.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
    },
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertGasto) => {
      const res = await fetch(api.expenses.create.path, {
        method: api.expenses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to add expense");
      return api.expenses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
    },
  });
}
