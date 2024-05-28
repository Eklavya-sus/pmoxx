import { newEnforcer } from "casbin";
import { CanParams, CanReturnType } from "@refinedev/core";
import { adapter, model } from "../casbin/accessControl";
import { authProvider } from "../authProvider";

export const accessControlProvider = {
  can: async ({ resource, action }: CanParams): Promise<CanReturnType> => {
    // Option 1: Type assertion
    const role = await (authProvider.getPermissions as Function)();

    // Option 2: Null check
    // const getPermissionsMethod = authProvider.getPermissions;
    // const role = getPermissionsMethod ? await getPermissionsMethod() : null;

    const enforcer = await newEnforcer(model, adapter);
    const can = await enforcer.enforce(role, resource, action);

    return Promise.resolve({
      can,
    });
  },
};