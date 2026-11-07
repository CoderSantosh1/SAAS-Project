import { createElement, type ComponentType, type ReactNode } from "react";

// createElement with children as the third argument (as the lint rule asks) while still
// type-checking components whose props require children.
export function withChildren<P extends { children?: ReactNode }>(type: ComponentType<P>, props: Omit<P, "children">, children: ReactNode) {
  return createElement(type as unknown as ComponentType<Omit<P, "children">>, props, children);
}
