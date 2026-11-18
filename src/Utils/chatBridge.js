const listeners = new Set();

export const openSupportChat = (context) => {
  listeners.forEach((cb) => cb(context));
};

export const onOpenSupportChat = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
