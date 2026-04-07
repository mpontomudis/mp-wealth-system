// src/shared/utils/cn.ts
type ClassValue = string | undefined | null | false | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return (classes.flat(Infinity) as (string | undefined | null | false)[])
    .filter(Boolean)
    .join(' ');
}
