import { getUser, type User } from "@/api/api";
import type { UserContextType } from "@/types";
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useOutletContext } from "react-router";

type UseAuthResult = {
  user: User | undefined;
} & Omit<UseQueryResult<User>, "data">;

export const useAuth = (options?: UseQueryOptions<User>): UseAuthResult => {
  const { data: user, ...rest } = useQuery({
    queryKey: ["auth"],
    queryFn: getUser,
    ...options,
  });
  return { user, ...rest };
};

export const useUser = () => {
  return useOutletContext<UserContextType>();
};
