export const audit = async ({ action, userId = null, metadata = {} }) => {
  return {
    action,
    userId,
    metadata,
    createdAt: new Date().toISOString(),
  };
};
