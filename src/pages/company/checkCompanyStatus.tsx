// CheckCompanyStatus.tsx
import { useOne } from "@refinedev/core";
import { CompanyCreatePage } from "./company-create";
import { supabaseClient } from "../../utility";
import { useGetIdentity } from "@refinedev/core";
import { Outlet } from "react-router-dom";
import React, { useEffect, useState } from 'react';

type IUser = {
  id: string;
  user_metadata: {
    avatar_url: string;
    email: string;
    email_verified: boolean;
    full_name: string;
    iss: string;
    name: string;
    phone_verified: boolean;
    picture: string;
    provider_id: string;
    sub: string;
  };
};

export const CheckCompanyStatus = () => {
  const { data: user } = useGetIdentity<IUser>();
  const specificUserId = user?.id;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserInCompany, setIsUserInCompany] = useState<boolean>(false);

  useEffect(() => {
    const fetchCompanyUsers = async () => {
      try {
        console.log('Fetching company users...');
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabaseClient
          .from('company_user')
          .select('*')
          .eq('user_id', specificUserId);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          console.log('Company users fetched successfully:', data);
          setIsUserInCompany(true);
        }
      } catch (error) {
        console.error('Error fetching company users:', error);
        setError('An error occurred while fetching company users.');
      } finally {
        setLoading(false);
      }
    };

    if (specificUserId) {
      fetchCompanyUsers();
    }
  }, [specificUserId]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return isUserInCompany ? <Outlet /> : <CompanyCreatePage />;
};
