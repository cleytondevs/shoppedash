import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
  });
}

export function useDashboardProducts(filter?: 'all' | 'social' | 'video') {
  return useQuery({
    queryKey: [api.dashboard.products.path, filter],
    queryFn: async () => {
      const url = filter 
        ? `${api.dashboard.products.path}?filter=${filter}` 
        : api.dashboard.products.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.dashboard.products.responses[200].parse(await res.json());
    },
  });
}

export function useUploadCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.upload.csv.input>) => {
      const res = await fetch(api.upload.csv.path, {
        method: api.upload.csv.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.upload.csv.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to upload CSV");
      }
      return api.upload.csv.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.products.path] });
    },
  });
}
