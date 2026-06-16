export const getCurrentUser = () => {
  const raw = localStorage.getItem('currentUser');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const hasPermission = (permission) => {
  const user = getCurrentUser();
  return user?.permissions?.includes(permission) ?? false;
};
