import { useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "../../../utility";
import { useState, useEffect } from "react";

interface IUser {
  id: string;
}

export const useCompanyId = (): [number | undefined, string | null] => {
  const { data: user } = useGetIdentity<IUser>();
  const [companyId, setCompanyId] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const { data: companyUserData, error: companyUserError } =
          await supabaseClient
            .from("company_user")
            .select("company_id")
            .eq("user_id", user?.id)
            .single();

        if (companyUserError) {
          console.error("Error fetching company_id:", companyUserError);
          setError("Error fetching company_id");
        } else {
          console.log("Fetched companyId:", companyUserData?.company_id);
          setCompanyId(companyUserData?.company_id);
        }
      } catch (error) {
        console.error("Error fetching company_id:", error);
        setError("Error fetching company_id");
      }
    };

    if (user?.id) {
      fetchCompanyId();
    }
  }, []);

  return [companyId, error];
};
