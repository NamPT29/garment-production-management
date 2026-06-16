export const ok = (res, data = {}, message = 'Thao tac thanh cong', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const created = (res, data = {}, message = 'Tao du lieu thanh cong') => {
  return ok(res, data, message, 201);
};
