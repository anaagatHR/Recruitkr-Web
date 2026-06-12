"use client";

/**
 * react-router-dom compatibility shim backed by next/navigation + next/link.
 *
 * This lets the pages/components that were written against react-router keep
 * their existing API (`<Link to>`, `useNavigate()`, `useParams()`, etc.) while
 * the app actually runs on the Next.js App Router. Only the import path changes:
 *   `from "react-router-dom"`  ->  `from "@/compat/router"`
 */

import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter } from "next/navigation";
import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type To = string;

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
  href?: To;
  replace?: boolean;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, href, replace, children, ...rest },
  ref,
) {
  const target = to ?? href ?? "#";
  return (
    <NextLink ref={ref} href={target} replace={replace} {...rest}>
      {children}
    </NextLink>
  );
});

type NavLinkClassName = string | ((state: { isActive: boolean; isPending: boolean }) => string);
type NavLinkChildren = ReactNode | ((state: { isActive: boolean; isPending: boolean }) => ReactNode);

type NavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children"> & {
  to: To;
  end?: boolean;
  className?: NavLinkClassName;
  activeClassName?: string;
  pendingClassName?: string;
  children?: NavLinkChildren;
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, end, className, activeClassName, pendingClassName, children, ...rest },
  ref,
) {
  const pathname = usePathname() || "/";
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`) || (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const state = { isActive: to === "/" ? pathname === "/" : isActive, isPending: false };

  const resolvedClassName =
    typeof className === "function"
      ? className(state)
      : cn(className, state.isActive && activeClassName, pendingClassName && undefined);

  return (
    <NextLink ref={ref} href={to} className={resolvedClassName} {...rest}>
      {typeof children === "function" ? children(state) : children}
    </NextLink>
  );
});

export type NavigateOptions = { replace?: boolean; state?: unknown };

export function useNavigate() {
  const router = useRouter();
  return (to: To | number, options?: NavigateOptions) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return (useNextParams() ?? {}) as T;
}

export function useLocation() {
  const pathname = usePathname() || "/";
  const [search, setSearch] = useState("");
  const [hash, setHash] = useState("");

  useEffect(() => {
    setSearch(window.location.search || "");
    setHash(window.location.hash || "");
  }, [pathname]);

  return useMemo(() => ({ pathname, search, hash, state: null }), [pathname, search, hash]);
}
