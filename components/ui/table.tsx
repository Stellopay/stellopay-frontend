"use client";

import * as React from "react";

import { cn } from "@/utils/commonUtils";

interface TableProps extends React.ComponentProps<"table"> {
  /** Makes the <thead> row stick to the top of the scroll container. */
  stickyHeader?: boolean;
  /** Makes the first column (th/td) stick to the left edge of the scroll container. */
  stickyFirstColumn?: boolean;
  /** Extra classes for the scroll container div (e.g. max-h-[480px] for vertical scroll). */
  containerClassName?: string;
}

function Table({
  className,
  containerClassName,
  stickyHeader = false,
  stickyFirstColumn = false,
  ...props
}: TableProps) {
  return (
    <div
      data-slot="table-container"
      data-sticky-header={stickyHeader || undefined}
      data-sticky-first-column={stickyFirstColumn || undefined}
      className={cn("relative w-full overflow-auto", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm",
          stickyHeader &&
            "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-20 [&_thead_th]:bg-background",
          stickyFirstColumn &&
            "[&_tbody_tr>:first-child]:sticky [&_tbody_tr>:first-child]:left-0 [&_tbody_tr>:first-child]:z-10 [&_tbody_tr>:first-child]:bg-background [&_tbody_tr>:first-child]:border-r [&_thead_tr>:first-child]:sticky [&_thead_tr>:first-child]:left-0 [&_thead_tr>:first-child]:z-30 [&_thead_tr>:first-child]:border-r",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
