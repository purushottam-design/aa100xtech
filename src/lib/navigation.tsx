"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, useCallback, type AnchorHTMLAttributes } from "react";

type SearchValues = Readonly<Record<string, unknown>>;

export type NavigationTarget = {
  to: string;
  params?: Readonly<Record<string, string | number>> | undefined;
  search?: SearchValues | undefined;
  hash?: string | undefined;
  replace?: boolean | undefined;
};

/** Keep the existing navigation destinations while delegating routing to Next.js. */
export function navigationHref({ to, params, search, hash }: NavigationTarget): string {
  let href = to.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (segment, key: string) => {
    const value = params?.[key];
    return value === undefined ? segment : encodeURIComponent(String(value));
  });

  if (search) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      query.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const encoded = query.toString();
    if (encoded) href += `${href.includes("?") ? "&" : "?"}${encoded}`;
  }

  if (hash) href += `#${hash.replace(/^#/, "")}`;
  return href;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  NavigationTarget & {
    activeProps?: AnchorHTMLAttributes<HTMLAnchorElement> | undefined;
    inactiveProps?: AnchorHTMLAttributes<HTMLAnchorElement> | undefined;
    activeOptions?: { exact?: boolean | undefined } | undefined;
    scroll?: boolean | undefined;
    prefetch?: boolean | null | undefined;
  };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    to,
    params,
    search,
    hash,
    replace,
    activeOptions,
    activeProps,
    inactiveProps,
    className,
    children,
    scroll,
    prefetch,
    ...props
  },
  ref,
) {
  const pathname = usePathname();
  const href = navigationHref({ to, params, search, hash });
  const targetPath = href.split(/[?#]/)[0]?.replace(/\/$/, "") || "/";
  const currentPath = pathname?.replace(/\/$/, "") || "/";
  const active =
    currentPath === targetPath ||
    (!activeOptions?.exact && targetPath !== "/" && currentPath.startsWith(`${targetPath}/`));
  const stateProps = (active ? activeProps : inactiveProps) ?? {};
  const mergedClassName = [className, stateProps.className].filter(Boolean).join(" ") || undefined;
  const { onClick, onMouseEnter, onTouchStart, ...anchorProps } = { ...props, ...stateProps };

  return (
    <NextLink
      {...anchorProps}
      ref={ref}
      href={href}
      className={mergedClassName}
      aria-current={active ? "page" : props["aria-current"]}
      data-status={active ? "active" : "inactive"}
      {...(onClick === undefined ? {} : { onClick })}
      {...(onMouseEnter === undefined ? {} : { onMouseEnter })}
      {...(onTouchStart === undefined ? {} : { onTouchStart })}
      {...(replace === undefined ? {} : { replace })}
      {...(scroll === undefined ? {} : { scroll })}
      {...(prefetch === undefined ? {} : { prefetch })}
    >
      {children}
    </NextLink>
  );
});

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (target: NavigationTarget) => {
      const href = navigationHref(target);
      if (target.replace) router.replace(href);
      else router.push(href);
    },
    [router],
  );
}

/** Existing shell components only select the current pathname. */
export function useRouterState<T>({
  select,
}: {
  select: (state: { location: { pathname: string } }) => T;
}): T {
  const pathname = usePathname();
  return select({ location: { pathname: pathname ?? "/" } });
}
