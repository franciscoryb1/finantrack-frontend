import { useQuery } from "@tanstack/react-query";
import { getTags } from "../api/tags.api";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
