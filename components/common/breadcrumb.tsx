"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbProps {
  /** Optional prefix to add to the breadcrumb trail (e.g., Home) */
  homeElement?: React.ReactNode;
  /** Separator between breadcrumb items */
  separator?: React.ReactNode;
  /** Capitalize the first letter of each breadcrumb segment */
  capitalizeLinks?: boolean;
}

export function Breadcrumb({
  homeElement = <Home className="w-4 h-4" aria-hidden="true" />,
  separator = <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />,
  capitalizeLinks = true,
}: BreadcrumbProps) {
  const paths = usePathname();
  const pathNames = paths.split("/").filter((path) => path);

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
        {pathNames.length > 0 && <li aria-hidden="true">{separator}</li>}
        {pathNames.map((link, index) => {
          let href = `/${pathNames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathNames.length - 1;
          const label = capitalizeLinks
            ? link.charAt(0).toUpperCase() + link.slice(1).replace(/-/g, " ")
            : link;

          return (
            <React.Fragment key={index}>
              <li className="flex items-center">
                {!isLast ? (
                  <Link
                    href={href}
                    className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    {label}
                  </Link>
                ) : (
                  <span
                    className="text-gray-900 font-medium"
                    aria-current="page"
                  >
                    {label}
                  </span>
                )}
              </li>
              {pathNames.length !== index + 1 && (
                <li aria-hidden="true">{separator}</li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
