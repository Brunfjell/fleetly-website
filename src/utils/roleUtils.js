export const ROLES = {
  ADMIN: "admin",
  DRIVER: "driver",
  EMPLOYEE: "employee",
};

export const canAccess = (role, allowedRoles = []) => {
  if (!role) return false;
  return allowedRoles.includes(role);
};
