import { getUser } from "@/api/api";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

export const useAuth = (options?: UseQueryOptions) => {
  const { data: user, ...rest } = useQuery({
    queryKey: ["auth"],
    queryFn: getUser,
    ...options,
  });
  return { user, ...rest };
};
