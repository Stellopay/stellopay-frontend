"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

/**
 * A single entry in an explicit breadcrumb trail.
 *
 * Omit `href` for the entry that represents the page the user is currently on;
 * it renders as static text carrying `aria-current="page"` instead of a link.
 */
export interface BreadcrumbItem {
  /** Visible label, e.g. "Account Summary". */
  label: string;
  /** Destination. Omit for the current page. */
  href?: string;
}

export interface BreadcrumbProps {
  /**
   * Explicit trail, used when the URL segments do not match the way the user
   * actually navigated (e.g. `/analytics-view` is reached from the dashboard
   * and reads better as "Dashboard > Analytics").
   *
   * When omitted, the trail is derived from the current pathname as before.
   */
  items?: BreadcrumbItem[];
  /** Optional prefix to add to the breadcrumb trail (e.g., Home) */
  homeElement?: React.ReactNode;
  /** Separator between breadcrumb items */
  separator?: React.ReactNode;
  /** Capitalize the first letter of each breadcrumb segment */
  capitalizeLinks?: boolean;
}

export function Breadcrumb({
  items,
  homeElement = <Home className="w-4 h-4" aria-hidden="true" />,
  separator = <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />,
  capitalizeLinks = true,
}: BreadcrumbProps) {
  const paths = usePathname() ?? "/";
  const pathNames = paths.split("/").filter((path) => path);

  const derived: BreadcrumbItem[] = pathNames.map((link, index) => ({
    label: capitalizeLinks
      ? link.charAt(0).toUpperCase() + link.slice(1).replace(/-/g, " ")
      : link,
    href:
      index === pathNames.length - 1
        ? undefined
        : `/${pathNames.slice(0, index + 1).join("/")}`,
  }));

  const trail = items ?? derived;

  return (
    <nav aria-label="Breadcrumb" className="w-full flex items-center mb-6">
      <ol className="flex items-center space-x-2 text-sm text-gray-500 flex-wrap">
        <li className="flex items-center">
          <Link
            href="/"
            className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label="Home"
          >
            {homeElement}
          </Link>
        </li>
        {trail.length > 0 && <li aria-hidden="true">{separator}</li>}
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-gray-900 font-medium"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && <li aria-hidden="true">{separator}</li>}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
