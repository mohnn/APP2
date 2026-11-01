let counter = 0;

/** معرّف فريد (لا يتكرر حتى لو أُنشئ سجلان في نفس اللحظة) */
export const uid = (prefix: string): string => {
  counter = (counter + 1) % 46656;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36).padStart(3, '0')}${Math.random().toString(36).slice(2, 5)}`;
};
